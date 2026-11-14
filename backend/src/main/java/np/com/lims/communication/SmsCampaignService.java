package np.com.lims.communication;

import com.fasterxml.jackson.databind.ObjectMapper;
import np.com.lims.common.api.PageResponse;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.communication.SmsRecipientQueryService.RawRecipient;
import np.com.lims.communication.SmsRecipientQueryService.ResolvedList;
import np.com.lims.communication.dto.CommunicationDtos.CampaignConfirmRequest;
import np.com.lims.communication.dto.CommunicationDtos.CampaignCreateRequest;
import np.com.lims.communication.dto.CommunicationDtos.CampaignResponse;
import np.com.lims.communication.dto.CommunicationDtos.RecipientFilterRequest;
import np.com.lims.communication.dto.CommunicationDtos.RecipientPreviewResponse;
import np.com.lims.communication.entity.SmsCampaign;
import np.com.lims.communication.entity.SmsCampaignRecipient;
import np.com.lims.communication.entity.SmsRecipientStatus;
import np.com.lims.communication.entity.SmsTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Create/preview/confirm/cancel for bulk SMS campaigns. Recipients are deliberately NOT computed
 * at {@link #create} time — only when {@link #confirm}ed, per {@code SmsCampaignStatus}'s own
 * javadoc, so editing a still-draft campaign's filter never leaves stale staged rows behind.
 * Actually sending is {@code SmsCampaignWorker}'s job, not this service's — the same split as
 * {@code PatientImportService} (create/configure) vs. {@code PatientImportWorker} (do the work).
 */
@Service
public class SmsCampaignService {

    private static final String MODULE = "COMMUNICATION";
    private static final String CAMPAIGN_SEQUENCE = "SMS_CAMPAIGN_NUMBER";

    private final SmsCampaignRepository campaignRepository;
    private final SmsCampaignRecipientRepository recipientRepository;
    private final SmsTemplateRepository templateRepository;
    private final SmsRecipientQueryService recipientQueryService;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public SmsCampaignService(SmsCampaignRepository campaignRepository, SmsCampaignRecipientRepository recipientRepository,
                              SmsTemplateRepository templateRepository, SmsRecipientQueryService recipientQueryService,
                              SequenceService sequenceService, AuditService auditService, ObjectMapper objectMapper) {
        this.campaignRepository = campaignRepository;
        this.recipientRepository = recipientRepository;
        this.templateRepository = templateRepository;
        this.recipientQueryService = recipientQueryService;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RecipientPreviewResponse preview(RecipientFilterRequest filterRequest, String messageBody) {
        ResolvedList resolved = recipientQueryService.resolve(toFilter(filterRequest));
        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate(messageBody == null ? "" : messageBody);
        long creditsPerRecipient = estimate.segmentCount();
        return new RecipientPreviewResponse(resolved.recipients().size(), resolved.invalidPhoneCount(),
                resolved.optedOutCount(), resolved.capped(), estimate.segmentCount(), estimate.encoding().name(),
                creditsPerRecipient);
    }

    @Transactional
    public CampaignResponse create(CampaignCreateRequest request) {
        SmsTemplate template = request.templateId() == null ? null
                : templateRepository.findById(request.templateId())
                        .orElseThrow(() -> ApiException.notFound("SmsTemplate", request.templateId()));
        String number = sequenceService.nextFormatted(CAMPAIGN_SEQUENCE, "CAMP", 6);
        String filterJson = toJson(request.recipientFilter());

        SmsCampaign campaign = SmsCampaign.draft(number, request.name().trim(), template,
                request.messageBody().trim(), request.category(), filterJson);
        campaign = campaignRepository.save(campaign);

        auditService.record(MODULE, "CREATE_CAMPAIGN", "SmsCampaign", campaign.getId(),
                "Created draft SMS campaign " + number + " (" + request.name() + ")", null, null);
        return toResponse(campaign);
    }

    /** Computes and stages recipients, then moves the campaign to QUEUED (now) or SCHEDULED (later). */
    @Transactional
    public CampaignResponse confirm(Long id, CampaignConfirmRequest request) {
        SmsCampaign campaign = load(id);
        RecipientFilterRequest filterRequest = fromJson(campaign.getRecipientFilter());
        ResolvedList resolved = recipientQueryService.resolve(toFilter(filterRequest));
        if (resolved.recipients().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "This campaign's recipient filter matched no one with a valid phone number — nothing to send.");
        }

        int sequence = 0;
        for (var recipient : resolved.recipients()) {
            recipientRepository.save(SmsCampaignRecipient.pending(
                    campaign.getOrganizationId(), campaign, recipient.patientId(), recipient.phone(),
                    recipient.name(), sequence++));
        }

        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate(campaign.getMessageBody());
        Instant scheduledAt = request == null ? null : request.scheduledAt();
        if (scheduledAt != null && scheduledAt.isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A campaign cannot be scheduled in the past.");
        }
        campaign.stage(resolved.recipients().size(), estimate.segmentCount() * resolved.recipients().size(), scheduledAt);
        campaign = campaignRepository.save(campaign);

        auditService.record(MODULE, "CONFIRM_CAMPAIGN", "SmsCampaign", campaign.getId(),
                "Confirmed SMS campaign " + campaign.getCampaignNumber() + " — " + resolved.recipients().size()
                        + " recipient(s), " + resolved.invalidPhoneCount() + " invalid number(s) skipped, "
                        + resolved.optedOutCount() + " opted-out number(s) skipped"
                        + (scheduledAt != null ? ", scheduled for " + scheduledAt : ", to send now"),
                null, null);
        return toResponse(campaign);
    }

    /** Requeues this campaign's failed recipients — see {@code SmsCampaign#retryFailed}'s own javadoc. */
    @Transactional
    public CampaignResponse retryFailed(Long id) {
        SmsCampaign campaign = load(id);
        List<SmsCampaignRecipient> failed = recipientRepository.findByCampaignIdAndStatus(id, SmsRecipientStatus.FAILED);
        if (failed.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "This campaign has no failed recipients to retry.");
        }
        failed.forEach(SmsCampaignRecipient::retry);
        recipientRepository.saveAll(failed);
        campaign.retryFailed(failed.size());
        campaign = campaignRepository.save(campaign);

        auditService.record(MODULE, "RETRY_CAMPAIGN_FAILURES", "SmsCampaign", campaign.getId(),
                "Requeued " + failed.size() + " failed recipient(s) for SMS campaign " + campaign.getCampaignNumber(),
                null, null);
        return toResponse(campaign);
    }

    @Transactional
    public CampaignResponse cancel(Long id) {
        SmsCampaign campaign = load(id);
        campaign.requestCancel();
        campaign = campaignRepository.save(campaign);
        auditService.record(MODULE, "CANCEL_CAMPAIGN", "SmsCampaign", campaign.getId(),
                "Requested cancellation of SMS campaign " + campaign.getCampaignNumber(), null, null);
        return toResponse(campaign);
    }

    @Transactional(readOnly = true)
    public CampaignResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<CampaignResponse> list(Pageable pageable) {
        Page<CampaignResponse> page = campaignRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<np.com.lims.communication.dto.CommunicationDtos.RecipientResponse> recipients(Long id, Pageable pageable) {
        load(id);
        return PageResponse.from(recipientRepository.findByCampaignIdOrderBySequenceNoAsc(id, pageable)
                .map(r -> new np.com.lims.communication.dto.CommunicationDtos.RecipientResponse(
                        r.getId(), r.getPatientId(), r.getPhone(), r.getName(), r.getSequenceNo(),
                        r.getStatus(), r.getErrorMessage(), r.getProcessedAt())));
    }

    private SmsCampaign load(Long id) {
        return campaignRepository.findById(id).orElseThrow(() -> ApiException.notFound("SmsCampaign", id));
    }

    private SmsRecipientQueryService.Filter toFilter(RecipientFilterRequest r) {
        List<RawRecipient> raw = r.rawRecipients() == null ? null
                : r.rawRecipients().stream().map(x -> new RawRecipient(x.phone(), x.name())).toList();
        return new SmsRecipientQueryService.Filter(r.type(), r.from(), r.to(), r.notVisitedDays(),
                r.departmentName(), r.patientIds(), raw);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Invalid recipient filter.");
        }
    }

    private RecipientFilterRequest fromJson(String json) {
        try {
            return objectMapper.readValue(json, RecipientFilterRequest.class);
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "This campaign's saved recipient filter could not be read.");
        }
    }

    private CampaignResponse toResponse(SmsCampaign c) {
        return new CampaignResponse(c.getId(), c.getCampaignNumber(), c.getName(), c.getCategory(), c.getStatus(),
                c.getTotalRecipients(), c.getSentCount(), c.getFailedCount(), c.getEstimatedSegments(),
                c.getScheduledAt(), c.getTimeZone(), c.isCancelRequested(), c.getFailureMessage(),
                c.getCreatedAt(), c.getStartedAt(), c.getCompletedAt(), c.getCreatedBy());
    }
}
