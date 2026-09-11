package np.com.lims.payment.dto;

import jakarta.validation.constraints.NotNull;
import np.com.lims.payment.entity.OnlinePayment;
import np.com.lims.payment.entity.OnlinePaymentStatus;
import np.com.lims.payment.entity.PaymentProvider;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public final class PaymentGatewayDtos {

    private PaymentGatewayDtos() {
    }

    public record InitiateRequest(@NotNull PaymentProvider provider) {
    }

    /** Either {@code redirectUrl} is set (send the browser there) or {@code formAction}+{@code formFields} are (auto-submit a hidden POST form to it — eSewa). */
    public record InitiateResponse(Long onlinePaymentId, String redirectUrl, String formAction, Map<String, String> formFields) {
    }

    public record OnlinePaymentDto(
            Long id, Long invoiceId, PaymentProvider provider, OnlinePaymentStatus status,
            BigDecimal amount, String transactionUuid, String providerReference,
            Instant initiatedAt, String initiatedBy, Instant verifiedAt, String failureReason
    ) {
        public static OnlinePaymentDto from(OnlinePayment p) {
            return new OnlinePaymentDto(p.getId(), p.getInvoice().getId(), p.getProvider(), p.getStatus(),
                    p.getAmount(), p.getTransactionUuid(), p.getProviderReference(),
                    p.getInitiatedAt(), p.getInitiatedBy(), p.getVerifiedAt(), p.getFailureReason());
        }
    }

    public record ProviderStatusDto(PaymentProvider provider, boolean configured) {
    }
}
