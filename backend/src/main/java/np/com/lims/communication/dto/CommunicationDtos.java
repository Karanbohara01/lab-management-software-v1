package np.com.lims.communication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import np.com.lims.communication.entity.SmsAutomationEvent;
import np.com.lims.communication.entity.SmsCampaignStatus;
import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.entity.SmsProvider;
import np.com.lims.communication.entity.SmsRecipientFilterType;
import np.com.lims.communication.entity.SmsRecipientStatus;
import np.com.lims.communication.entity.FollowUpStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Request/response shapes for the whole Communication Hub module. */
public final class CommunicationDtos {

    private CommunicationDtos() {
    }

    // ----- Templates -------------------------------------------------------------------------

    public record TemplateRequest(@NotBlank String name, @NotNull SmsCategory category, @NotBlank String body) {
    }

    public record TemplateResponse(Long id, String name, SmsCategory category, String body, boolean active,
                                   int characterCount, Instant createdAt, Instant updatedAt) {
    }

    // ----- Automation rules --------------------------------------------------------------------

    public record AutomationRuleResponse(Long id, SmsAutomationEvent eventType, String eventLabel, boolean enabled,
                                         Long templateId, String templateName, Integer reminderOffsetHours,
                                         long firedCount, long failedCount) {
    }

    public record AutomationRuleUpdateRequest(boolean enabled, Long templateId, Integer reminderOffsetHours) {
    }

    // ----- Recipient filter / campaigns --------------------------------------------------------

    public record RawRecipientRequest(@NotBlank String phone, String name) {
    }

    public record RecipientFilterRequest(@NotNull SmsRecipientFilterType type, Instant from, Instant to,
                                         Integer notVisitedDays, String departmentName, List<Long> patientIds,
                                         List<RawRecipientRequest> rawRecipients) {
    }

    public record RecipientPreviewResponse(int recipientCount, int invalidPhoneCount, int optedOutCount, boolean capped,
                                           int estimatedSegments, String encoding, long estimatedCreditsPerRecipient) {
    }

    public record CampaignCreateRequest(@NotBlank String name, Long templateId, @NotBlank String messageBody,
                                        @NotNull SmsCategory category, @NotNull RecipientFilterRequest recipientFilter) {
    }

    public record CampaignConfirmRequest(Instant scheduledAt, String timeZone) {
    }

    public record RecipientResponse(Long id, Long patientId, String phone, String name, int sequenceNo,
                                    SmsRecipientStatus status, String errorMessage, Instant processedAt) {
    }

    public record CampaignResponse(Long id, String campaignNumber, String name, SmsCategory category,
                                   SmsCampaignStatus status, int totalRecipients, int sentCount, int failedCount,
                                   int estimatedSegments, Instant scheduledAt, String timeZone, boolean cancelRequested,
                                   String failureMessage, Instant createdAt, Instant startedAt, Instant completedAt,
                                   String createdBy) {
    }

    // ----- Messages / history ------------------------------------------------------------------

    public record SendSmsRequest(Long patientId, @NotBlank String phone, String recipientName,
                                 @NotNull SmsCategory category, Long templateId, String messageBody) {
    }

    public record MessageResponse(Long id, Long patientId, String recipientPhone, String recipientName,
                                  SmsCategory category, String messageBody, int segmentCount, String encoding,
                                  SmsProvider provider, SmsMessageStatus status, String providerReference,
                                  String errorCode, String errorMessage, String sentBy, Instant sentAt,
                                  Instant createdAt, Long campaignId, String campaignNumber) {
    }

    public record SendSmsResponse(boolean sent, MessageResponse message, String errorMessage) {
    }

    // ----- Dashboard -----------------------------------------------------------------------

    public record DashboardResponse(long totalMessages, long delivered, long sent, long failed, long pending,
                                    long segmentsToday, long segmentsThisMonth, long campaignsConducted,
                                    double deliverySuccessRatePercent, List<GatewayStatusResponse> gateways) {
    }

    // ----- Follow-ups -----------------------------------------------------------------------

    public record FollowUpRequest(@NotNull Long patientId, @NotNull LocalDate dueDate, String reason) {
    }

    public record FollowUpResponse(Long id, Long patientId, String patientName, LocalDate dueDate, String reason,
                                   FollowUpStatus status, Instant reminderSentAt, Instant createdAt) {
    }

    // ----- Gateway configuration -------------------------------------------------------------

    public record GatewayStatusResponse(SmsProvider provider, String label, boolean configured) {
    }

    public record SamayaConfigResponse(boolean enabled, String baseUrl, String senderId, boolean hasApiKey) {
        public static SamayaConfigResponse empty() {
            return new SamayaConfigResponse(false, null, null, false);
        }
    }

    public record SamayaConfigRequest(boolean enabled, String baseUrl, String senderId, String apiKey) {
    }

    public record BalanceResponse(boolean available, Long balance, String rawResponse, String errorMessage) {
    }

    public record TestSmsRequest(@NotBlank String phone) {
    }

    // ----- Opt-outs (do-not-contact list) -----------------------------------------------------

    public record OptOutRequest(@NotBlank String phone, Long patientId, String reason, String note) {
    }

    public record OptOutResponse(Long id, String phone, Long patientId, String patientName, String reason,
                                 String note, Instant createdAt, String createdBy) {
    }
}
