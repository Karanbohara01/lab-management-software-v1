package np.com.lims.ird.gateway;

/**
 * Port for filing an invoice with the IRD / CBMS e-billing system.
 *
 * <p>The application depends only on this interface. Invoice creation and payment recording
 * must never call it directly — submission is an explicit, separately-triggered action so
 * that a slow or failing IRD service can never block billing.
 *
 * <h2>Implementing a real gateway</h2>
 * <ol>
 *   <li>Obtain the current IRD CBMS API documentation, the seller enrolment, and credentials.</li>
 *   <li>Map {@link IrdBillPayload} to the exact request the API expects (do not guess field names).</li>
 *   <li>Apply any required signing / hashing / sequence rules from the spec.</li>
 *   <li>Translate the API response to a {@link Result}; treat "already exists" as
 *       {@link Result.Status#DUPLICATE} so the caller never resubmits.</li>
 *   <li>Register the implementation as the {@code IrdGateway} bean and set {@code lims.ird.enabled=true}.</li>
 * </ol>
 *
 * <p>Until that is done the {@link UnconfiguredIrdGateway} is active and nothing is transmitted.
 */
public interface IrdGateway {

    /** Human-readable environment label, e.g. {@code "DISABLED"}, {@code "TEST"}, {@code "PRODUCTION"}. */
    String environment();

    /** True only when a verified, credentialed gateway is wired in. */
    boolean isConfigured();

    Result submit(IrdBillPayload payload);

    record Result(Status status, String providerReference, String errorCode, String errorMessage, String rawResponse) {

        public enum Status { ACCEPTED, DUPLICATE, REJECTED, TRANSPORT_ERROR }

        public static Result accepted(String reference, String raw) {
            return new Result(Status.ACCEPTED, reference, null, null, raw);
        }

        public static Result duplicate(String reference, String raw) {
            return new Result(Status.DUPLICATE, reference, null, null, raw);
        }

        public static Result rejected(String code, String message, String raw) {
            return new Result(Status.REJECTED, null, code, message, raw);
        }

        public static Result transportError(String code, String message) {
            return new Result(Status.TRANSPORT_ERROR, null, code, message, null);
        }

        public boolean transmitted() {
            return status != Status.TRANSPORT_ERROR;
        }
    }
}
