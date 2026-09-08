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

    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND),

    RESOURCE_CONFLICT(HttpStatus.CONFLICT),
    INVALID_STATE_TRANSITION(HttpStatus.CONFLICT),

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
