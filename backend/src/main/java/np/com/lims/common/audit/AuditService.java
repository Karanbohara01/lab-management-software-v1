package np.com.lims.common.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Central entry point for writing audit trail entries. Callers pass domain objects; this service
 * resolves the current actor and request metadata and serializes before/after snapshots.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String module, String action, String entityType, Object entityId,
                       String summary, Object before, Object after) {
        AuditLog entry = new AuditLog(
                currentActor(), action, module, entityType,
                entityId == null ? null : String.valueOf(entityId),
                summary, toJson(before), toJson(after),
                requestAttr(true), requestAttr(false));
        repository.save(entry);
    }

    private String currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || auth.getName() == null ? "system" : auth.getName();
    }

    private String requestAttr(boolean ip) {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        HttpServletRequest req = attrs.getRequest();
        return ip ? req.getRemoteAddr() : truncate(req.getHeader("User-Agent"), 255);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit snapshot: {}", e.getMessage());
            return null;
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
