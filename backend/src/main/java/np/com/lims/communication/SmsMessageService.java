package np.com.lims.communication;

import np.com.lims.common.api.PageResponse;
import np.com.lims.common.exception.ApiException;
import np.com.lims.communication.dto.CommunicationDtos.MessageResponse;
import np.com.lims.communication.entity.SmsCampaign;
import np.com.lims.communication.entity.SmsAutomationRule;
import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsMessage;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.entity.SmsProvider;
import np.com.lims.communication.gateway.SmsGatewayRegistry;
import np.com.lims.messaging.gateway.SmsGateway;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * The single place every SMS attempt — manually sent, automation-fired, or campaign-batched —
 * actually goes out through, so {@code SmsMessage} is structurally guaranteed a row for every
 * attempt (the feature's own requirement) rather than relying on every caller to remember to log
 * one. Mirrors {@code PatientMessagingService}'s "call the gateway, report the honest result"
 * shape, but against the provider the {@link SmsGatewayRegistry} resolves rather than a single
 * fixed gateway, and always writes the attempt to {@link SmsMessage} first.
 */
@Service
public class SmsMessageService {

    private final SmsMessageRepository messageRepository;
    private final SmsGatewayRegistry gatewayRegistry;
    private final SmsOptOutRepository optOutRepository;

    public SmsMessageService(SmsMessageRepository messageRepository, SmsGatewayRegistry gatewayRegistry,
                             SmsOptOutRepository optOutRepository) {
        this.messageRepository = messageRepository;
        this.gatewayRegistry = gatewayRegistry;
        this.optOutRepository = optOutRepository;
    }

    public record SendCommand(Long patientId, String phone, String recipientName, SmsCategory category,
                              String messageBody, String sentBy, SmsCampaign campaign, SmsAutomationRule automationRule,
                              SmsProvider forceProvider) {

        public static SendCommand manual(Long patientId, String phone, String recipientName, SmsCategory category,
                                         String messageBody, String sentBy) {
            return new SendCommand(patientId, phone, recipientName, category, messageBody, sentBy, null, null, null);
        }

        public static SendCommand automated(Long patientId, String phone, String recipientName, SmsCategory category,
                                            String messageBody, SmsAutomationRule rule) {
            return new SendCommand(patientId, phone, recipientName, category, messageBody, "system:automation", null, rule, null);
        }

        public static SendCommand campaign(Long patientId, String phone, String recipientName, SmsCategory category,
                                           String messageBody, SmsCampaign campaign) {
            return new SendCommand(patientId, phone, recipientName, category, messageBody, "system:campaign", campaign, null, null);
        }

        /** The "Test SMS" button on the config screen — must go through the provider the admin clicked, not whichever is effective. */
        public static SendCommand test(String phone, SmsCategory category, String messageBody, String sentBy, SmsProvider provider) {
            return new SendCommand(null, phone, "Test", category, messageBody, sentBy, null, null, provider);
        }
    }

    /**
     * Sends one message and writes exactly one {@link SmsMessage} row, whatever the outcome.
     * Never throws on a provider failure — the caller reads {@code SmsMessage.getStatus()} to
     * decide what to do next (surface an error to the user, count it as a campaign failure, etc).
     *
     * <p>Deliberately {@code REQUIRES_NEW}: this is an external side effect (a real SMS, once
     * sent, cannot be recalled), called both standalone (manual send, the campaign worker's own
     * transaction) and from inside a larger business transaction ({@code SmsAutomationTriggerService},
     * fired alongside patient registration / appointment / order / report / payment actions). Its
     * own transaction means the attempt is durably logged the moment it happens, and a later
     * unrelated failure in whatever triggered it can never silently roll the log entry back —
     * same reasoning {@code AuditService#record} and {@code NotificationSweeper} already use.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SmsMessage send(SendCommand cmd) {
        String phone = NepaliPhoneValidator.normalize(cmd.phone());
        SmsSegmentCalculator.Estimate estimate = SmsSegmentCalculator.estimate(cmd.messageBody());
        SmsGatewayRegistry.ResolvedGateway resolved = cmd.forceProvider() != null
                ? new SmsGatewayRegistry.ResolvedGateway(cmd.forceProvider(), gatewayRegistry.get(cmd.forceProvider()))
                : gatewayRegistry.effective();

        SmsMessage message = SmsMessage.attempt(cmd.patientId(), phone, cmd.recipientName(), cmd.category(),
                cmd.messageBody(), estimate.segmentCount(), estimate.encoding().name(), resolved.provider(),
                cmd.sentBy(), cmd.campaign(), cmd.automationRule());

        // A hard stop, not a warning — see SmsOptOut's javadoc. No path (manual, automated,
        // campaign) can reach the gateway for a number on this list; the attempt is still logged,
        // honestly, as a failure rather than silently vanishing.
        if (optOutRepository.existsByPhone(phone)) {
            message.markFailed("RECIPIENT_OPTED_OUT", "This phone number has opted out of SMS and was not contacted.");
            return messageRepository.save(message);
        }

        message = messageRepository.save(message);

        SmsGateway.Result result = resolved.gateway().send(phone, cmd.messageBody());
        if (result.sent()) {
            message.markSent(result.providerReference());
        } else {
            message.markFailed(result.errorCode(), result.errorMessage());
        }
        return messageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public SmsMessage findOrThrow(Long id) {
        return messageRepository.findById(id).orElseThrow(() -> ApiException.notFound("SmsMessage", id));
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> history(Instant from, Instant to, Long patientId, String phone,
                                                 SmsCategory category, SmsMessageStatus status, Long campaignId,
                                                 String sentBy, Pageable pageable) {
        return PageResponse.from(messageRepository.search(from, to, patientId, phone, category, status, campaignId,
                sentBy, pageable).map(SmsSendService::toResponse));
    }

    @Transactional(readOnly = true)
    public java.util.List<MessageResponse> forPatient(Long patientId) {
        return messageRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(SmsSendService::toResponse).toList();
    }
}
