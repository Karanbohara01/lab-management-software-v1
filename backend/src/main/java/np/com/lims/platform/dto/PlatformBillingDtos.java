package np.com.lims.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.platform.entity.PlatformIrdSubmission;
import np.com.lims.platform.entity.SubscriptionInvoice;
import np.com.lims.platform.entity.SubscriptionInvoiceStatus;

import java.math.BigDecimal;
import java.time.Instant;

/** Platform-admin view of subscription invoices and their IRD/CBMS e-billing status — what THIS
 * deployment charges a clinic, distinct from {@code SubscriptionBillingDtos} (the clinic's own
 * "my billing" view of the same invoices). */
public final class PlatformBillingDtos {

    private PlatformBillingDtos() {
    }

    public record InvoiceListItem(Long id, String invoiceNumber, Long organizationId, String organizationName,
                                  String planName, BigDecimal totalAmount, BigDecimal taxAmount,
                                  Instant periodStart, Instant periodEnd, Instant dueAt,
                                  SubscriptionInvoiceStatus status, Instant paidAt, IrdStatus irdStatus) {
        public static InvoiceListItem from(SubscriptionInvoice inv, String orgName, IrdStatus irdStatus) {
            return new InvoiceListItem(inv.getId(), inv.invoiceNumber(), inv.getOrganizationId(), orgName,
                    inv.getPlanName(), inv.getTotalAmount(), inv.getTaxAmount(), inv.getPeriodStart(),
                    inv.getPeriodEnd(), inv.getDueAt(), inv.getStatus(), inv.getPaidAt(),
                    irdStatus == null ? IrdStatus.NOT_SUBMITTED : irdStatus);
        }
    }

    public record IrdSubmissionDetail(Long id, Long subscriptionInvoiceId, String invoiceNumber, Long organizationId,
                                      String organizationName, String planName, BigDecimal taxableAmount,
                                      BigDecimal taxAmount, BigDecimal totalAmount, SubscriptionInvoiceStatus invoiceStatus,
                                      IrdStatus status, String providerReference, String lastErrorCode,
                                      String lastErrorMessage, int attemptCount, boolean manual, String manualReference,
                                      String notes, Instant submittedAt, Instant acceptedAt) {
        public static IrdSubmissionDetail from(PlatformIrdSubmission s, String orgName) {
            SubscriptionInvoice inv = s.getSubscriptionInvoice();
            return new IrdSubmissionDetail(s.getId(), inv.getId(), inv.invoiceNumber(), inv.getOrganizationId(),
                    orgName, inv.getPlanName(), inv.getTaxableAmount(), inv.getTaxAmount(), inv.getTotalAmount(),
                    inv.getStatus(), s.getStatus(), s.getProviderReference(), s.getLastErrorCode(),
                    s.getLastErrorMessage(), s.getAttemptCount(), s.isManual(), s.getManualReference(),
                    s.getNotes(), s.getSubmittedAt(), s.getAcceptedAt());
        }
    }

    public record MarkManualRequest(@NotBlank String reference, String note) {
    }

    public record IrdConfigResponse(boolean configured, String environment, String message) {
    }

    /** Never exposes the decrypted password — only whether one is set. */
    public record IrdCredentialsResponse(boolean enabled, String username, String sellerPan, String sellerName,
                                         boolean passwordConfigured) {
        public static IrdCredentialsResponse empty() {
            return new IrdCredentialsResponse(false, null, null, null, false);
        }
    }

    /** Leave the password blank to keep the existing one — only a non-blank value replaces it. */
    public record IrdCredentialsUpdateRequest(
            boolean enabled,
            @Size(max = 120) String username,
            @Size(max = 40) String sellerPan,
            @Size(max = 160) String sellerName,
            @Size(max = 200) String password
    ) {
    }
}
