package np.com.lims.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import np.com.lims.common.api.ApiError;
import np.com.lims.common.exception.ErrorCode;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** JSON-emitting handlers so unauthenticated / unauthorized responses match the global error contract. */
@Component
public class RestAuthEntryPoints implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAuthEntryPoints(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        write(response, request, ErrorCode.AUTHENTICATION_REQUIRED, "Authentication is required");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        write(response, request, ErrorCode.ACCESS_DENIED, "You do not have permission to perform this action");
    }

    private void write(HttpServletResponse response, HttpServletRequest request,
                       ErrorCode code, String message) throws IOException {
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = ApiError.of(code.name(), message, code.status().value(), request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
