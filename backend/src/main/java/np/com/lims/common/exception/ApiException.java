package np.com.lims.common.exception;

/** Base type for all deliberately-thrown, client-facing errors. */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }

    public static ApiException notFound(String resource, Object id) {
        return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, "%s not found: %s".formatted(resource, id));
    }

    public static ApiException conflict(String message) {
        return new ApiException(ErrorCode.RESOURCE_CONFLICT, message);
    }

    public static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATE_TRANSITION, message);
    }
}
