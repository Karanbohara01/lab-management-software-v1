package np.com.lims.communication;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.communication.dto.CommunicationDtos.MessageResponse;
import np.com.lims.communication.dto.CommunicationDtos.SendSmsRequest;
import np.com.lims.communication.dto.CommunicationDtos.SendSmsResponse;
import np.com.lims.communication.entity.SmsMessage;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.entity.SmsTemplate;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * The manual "Send SMS" screen's own entry point — from a patient's profile, or a free-standing
 * compose box. Resolves an optional template + patient context into the final message text, then
 * hands off to {@link SmsMessageService} for the actual send-and-log. Kept separate from that
 * service so the low-level send primitive stays free of template/patient lookups it doesn't need
 * for its other two callers (automation triggers, the campaign worker).
 */
@Service
public class SmsSendService {

    private final SmsMessageService messageService;
    private final SmsTemplateRepository templateRepository;
    private final PatientRepository patientRepository;
    private final LaboratoryProfileService laboratoryProfileService;

    public SmsSendService(SmsMessageService messageService, SmsTemplateRepository templateRepository,
                          PatientRepository patientRepository, LaboratoryProfileService laboratoryProfileService) {
        this.messageService = messageService;
        this.templateRepository = templateRepository;
        this.patientRepository = patientRepository;
        this.laboratoryProfileService = laboratoryProfileService;
    }

    @Transactional
    public SendSmsResponse send(SendSmsRequest request) {
        if (!NepaliPhoneValidator.isValidMobile(request.phone())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "\"" + request.phone() + "\" does not look like a Nepali mobile number.");
        }

        Patient patient = request.patientId() == null ? null
                : patientRepository.findById(request.patientId()).orElseThrow(() -> ApiException.notFound("Patient", request.patientId()));

        String body = request.messageBody();
        if (request.templateId() != null) {
            SmsTemplate template = templateRepository.findByIdAndActiveTrue(request.templateId())
                    .orElseThrow(() -> ApiException.notFound("SmsTemplate", request.templateId()));
            Map<String, String> placeholders = new HashMap<>();
            if (patient != null) {
                placeholders.put("patientName", patient.getFullName());
                placeholders.put("mrn", patient.getMrn());
            }
            placeholders.put("labName", laboratoryProfileService.require().getName());
            body = SmsPlaceholderResolver.resolve(template.getBody(), placeholders);
        }
        if (body == null || body.isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "A message body or template is required.");
        }

        String recipientName = request.recipientName() != null ? request.recipientName()
                : (patient != null ? patient.getFullName() : null);
        SmsMessage message = messageService.send(SmsMessageService.SendCommand.manual(
                request.patientId(), request.phone(), recipientName, request.category(), body, CurrentUser.username()));

        boolean sent = message.getStatus() == SmsMessageStatus.SENT || message.getStatus() == SmsMessageStatus.DELIVERED;
        return new SendSmsResponse(sent, toResponse(message), sent ? null : message.getErrorMessage());
    }

    /**
     * Resends a failed message as a brand-new attempt — never mutates the original row, consistent
     * with {@code SmsMessage} being an append-only log (see its own javadoc): the history keeps
     * both the original failure and whatever this resend produces, rather than papering over what
     * actually happened.
     */
    @Transactional
    public SendSmsResponse resend(Long messageId) {
        SmsMessage original = messageService.findOrThrow(messageId);
        if (original.getStatus() != SmsMessageStatus.FAILED) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT, "Only a failed message can be resent.");
        }
        SmsMessage resent = messageService.send(SmsMessageService.SendCommand.manual(
                original.getPatientId(), original.getRecipientPhone(), original.getRecipientName(),
                original.getCategory(), original.getMessageBody(), CurrentUser.username()));
        boolean sent = resent.getStatus() == SmsMessageStatus.SENT || resent.getStatus() == SmsMessageStatus.DELIVERED;
        return new SendSmsResponse(sent, toResponse(resent), sent ? null : resent.getErrorMessage());
    }

    static MessageResponse toResponse(SmsMessage m) {
        return new MessageResponse(m.getId(), m.getPatientId(), m.getRecipientPhone(), m.getRecipientName(),
                m.getCategory(), m.getMessageBody(), m.getSegmentCount(), m.getEncoding(), m.getProvider(),
                m.getStatus(), m.getProviderReference(), m.getErrorCode(), m.getErrorMessage(), m.getSentBy(),
                m.getSentAt(), m.getCreatedAt(), m.getCampaign() == null ? null : m.getCampaign().getId(),
                m.getCampaign() == null ? null : m.getCampaign().getCampaignNumber());
    }
}
