package np.com.lims.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import np.com.lims.common.api.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException ex, HttpServletRequest req) {
        ErrorCode code = ex.errorCode();
        if (code.status().is5xxServerError()) {
            log.error("API exception at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        }
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code.name(), ex.getMessage(), code.status().value(), req.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleBeanValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiError.FieldViolation> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(this::toViolation)
                .toList();
        ErrorCode code = ErrorCode.VALIDATION_FAILED;
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code.name(), "Request validation failed", code.status().value(),
                        req.getRequestURI(), violations));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiError> handleParamValidation(HandlerMethodValidationException ex, HttpServletRequest req) {
        ErrorCode code = ErrorCode.VALIDATION_FAILED;
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code.name(), "Request validation failed", code.status().value(), req.getRequestURI()));
    }

    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    public ResponseEntity<ApiError> handleAuth(AuthenticationException ex, HttpServletRequest req) {
        ErrorCode code = ex instanceof BadCredentialsException ? ErrorCode.INVALID_CREDENTIALS : ErrorCode.AUTHENTICATION_REQUIRED;
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code.name(), "Authentication failed", code.status().value(), req.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        ErrorCode code = ErrorCode.ACCESS_DENIED;
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code.name(), "You do not have permission to perform this action",
                        code.status().value(), req.getRequestURI()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex,
                                                        HttpServletRequest req) {
        log.warn("Data integrity violation at {}: {}", req.getRequestURI(), ex.getMostSpecificCause().getMessage());
        ErrorCode code = ErrorCode.RESOURCE_CONFLICT;
        return ResponseEntity.status(code.status()).body(ApiError.of(code.name(),
                "This change conflicts with existing records — a referenced item is still in use "
                        + "(for example, editing test parameters after results have been recorded against them).",
                code.status().value(), req.getRequestURI()));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(org.springframework.http.converter.HttpMessageNotReadableException ex,
                                                     HttpServletRequest req) {
        ErrorCode code = ErrorCode.MALFORMED_REQUEST;
        return ResponseEntity.status(code.status()).body(ApiError.of(code.name(),
                "The request body could not be read", code.status().value(), req.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception at {}", req.getRequestURI(), ex);
        ErrorCode code = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code.name(), "An unexpected error occurred", code.status().value(), req.getRequestURI()));
    }

    private ApiError.FieldViolation toViolation(FieldError fe) {
        return new ApiError.FieldViolation(fe.getField(),
                fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage());
    }
}
