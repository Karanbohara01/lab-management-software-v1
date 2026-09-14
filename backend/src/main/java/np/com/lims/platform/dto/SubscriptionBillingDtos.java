package np.com.lims.platform.dto;

import jakarta.validation.constraints.NotBlank;
import np.com.lims.platform.entity.Subscription;
import np.com.lims.platform.entity.SubscriptionInvoice;
import np.com.lims.platform.entity.SubscriptionInvoiceStatus;
import np.com.lims.platform.entity.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public final class SubscriptionBillingDtos {

    private SubscriptionBillingDtos() {
    }

    /** This clinic's own plan + subscription status, for the "Plan & billing" settings screen. */
    public record MySubscriptionResponse(String planCode, String planName, BigDecimal priceMonthly,
                                         int maxUsers, int maxBranches, SubscriptionStatus status,
                                         Instant currentPeriodEnd, String pendingPlanCode, String pendingPlanName,
                                         Instant pendingPlanRequestedAt) {
        public static MySubscriptionResponse from(Subscription s) {
            var plan = s.getPlan();
            var pending = s.getPendingPlan();
            return new MySubscriptionResponse(plan.getCode(), plan.getName(), plan.getPriceMonthly(),
                    plan.getMaxUsers(), plan.getMaxBranches(), s.getStatus(), s.getCurrentPeriodEnd(),
                    pending == null ? null : pending.getCode(), pending == null ? null : pending.getName(),
                    s.getPendingPlanRequestedAt());
        }
    }

    public record ChangePlanRequest(@NotBlank String planCode) {
    }

    public record SubscriptionInvoiceDto(Long id, String invoiceNumber, String planCode, String planName,
                                         BigDecimal amount, BigDecimal taxableAmount, BigDecimal taxAmount,
                                         BigDecimal totalAmount, Instant periodStart, Instant periodEnd, Instant dueAt,
                                         SubscriptionInvoiceStatus status, Instant paidAt, String paymentReference) {
        public static SubscriptionInvoiceDto from(SubscriptionInvoice inv) {
            return new SubscriptionInvoiceDto(inv.getId(), inv.invoiceNumber(), inv.getPlanCode(), inv.getPlanName(),
                    inv.getAmount(), inv.getTaxableAmount(), inv.getTaxAmount(), inv.getTotalAmount(),
                    inv.getPeriodStart(), inv.getPeriodEnd(), inv.getDueAt(), inv.getStatus(),
                    inv.getPaidAt(), inv.getPaymentReference());
        }
    }

    /** Either {@code formAction}/{@code formFields} (eSewa: auto-submit a hidden POST form) is set, or {@code errorMessage} is. */
    public record InitiateCheckoutResponse(boolean success, String formAction, Map<String, String> formFields, String errorMessage) {
    }
}
