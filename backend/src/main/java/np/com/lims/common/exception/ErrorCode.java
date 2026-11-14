package np.com.lims.common.exception;

import org.springframework.http.HttpStatus;

/** Central catalogue of business/technical error codes surfaced to clients. */
public enum ErrorCode {

    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),

    AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED),

    ACCESS_DENIED(HttpStatus.FORBIDDEN),
    /** A clinic's account is suspended for non-payment — everything except viewing/paying its own subscription bill is blocked. */
    SUBSCRIPTION_SUSPENDED(HttpStatus.PAYMENT_REQUIRED),

    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND),

    RESOURCE_CONFLICT(HttpStatus.CONFLICT),
    INVALID_STATE_TRANSITION(HttpStatus.CONFLICT),
    /**
     * A test result still has parameters with no value, and the caller tried to verify or approve
     * it without a documented override reason. Its own code (not a generic conflict) so a client
     * can tell "fill in the blanks or give a reason" apart from the other 409s the same endpoints
     * raise (self-verification, QC lock) and ask the right question.
     */
    RESULT_INCOMPLETE(HttpStatus.CONFLICT),

    /** An external integration (SMS/WhatsApp gateway, analyzer, IRD, ...) could not complete the request. */
    EXTERNAL_SERVICE_UNAVAILABLE(HttpStatus.BAD_GATEWAY),

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
