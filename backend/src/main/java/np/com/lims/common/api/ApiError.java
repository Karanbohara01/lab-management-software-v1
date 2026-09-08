package np.com.lims.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Uniform error contract returned by every failing endpoint.
 *
 * @param code       stable machine-readable error code (see {@code ErrorCode})
 * @param message    human-readable, safe-to-display summary
 * @param status     HTTP status code
 * @param path       request path that produced the error
 * @param timestamp  server time the error was produced
 * @param fieldErrors per-field validation messages, when applicable
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        String code,
        String message,
        int status,
        String path,
        Instant timestamp,
        List<FieldViolation> fieldErrors
) {
    public record FieldViolation(String field, String message) {}

    public static ApiError of(String code, String message, int status, String path) {
        return new ApiError(code, message, status, path, Instant.now(), List.of());
    }

    public static ApiError of(String code, String message, int status, String path, List<FieldViolation> fieldErrors) {
        return new ApiError(code, message, status, path, Instant.now(), fieldErrors);
    }
}
