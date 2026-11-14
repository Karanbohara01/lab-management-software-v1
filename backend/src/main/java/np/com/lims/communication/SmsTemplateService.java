package np.com.lims.communication;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.communication.dto.CommunicationDtos.TemplateRequest;
import np.com.lims.communication.dto.CommunicationDtos.TemplateResponse;
import np.com.lims.communication.entity.SmsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** CRUD for reusable SMS templates — used by automation rules, campaigns, and the manual send screen. */
@Service
public class SmsTemplateService {

    private static final String MODULE = "COMMUNICATION";

    private final SmsTemplateRepository repository;
    private final AuditService auditService;

    public SmsTemplateService(SmsTemplateRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> list() {
        return repository.findAllByOrderByNameAsc().stream().map(SmsTemplateService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional
    public TemplateResponse create(TemplateRequest request) {
        SmsTemplate template = SmsTemplate.create(request.name().trim(), request.category(), request.body().trim());
        template = repository.save(template);
        auditService.record(MODULE, "CREATE_TEMPLATE", "SmsTemplate", template.getId(),
                "Created SMS template \"" + template.getName() + "\"", null, null);
        return toResponse(template);
    }

    @Transactional
    public TemplateResponse update(Long id, TemplateRequest request) {
        SmsTemplate template = load(id);
        template.update(request.name().trim(), request.category(), request.body().trim());
        auditService.record(MODULE, "UPDATE_TEMPLATE", "SmsTemplate", id,
                "Updated SMS template \"" + template.getName() + "\"", null, null);
        return toResponse(template);
    }

    @Transactional
    public TemplateResponse setActive(Long id, boolean active) {
        SmsTemplate template = load(id);
        template.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE_TEMPLATE" : "DEACTIVATE_TEMPLATE", "SmsTemplate", id,
                (active ? "Activated" : "Deactivated") + " SMS template \"" + template.getName() + "\"", null, null);
        return toResponse(template);
    }

    private SmsTemplate load(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("SmsTemplate", id));
    }

    private static TemplateResponse toResponse(SmsTemplate t) {
        return new TemplateResponse(t.getId(), t.getName(), t.getCategory(), t.getBody(), t.isActive(),
                t.getBody().length(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
