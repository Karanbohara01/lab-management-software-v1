package np.com.lims.communication;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.communication.dto.CommunicationDtos.AutomationRuleResponse;
import np.com.lims.communication.dto.CommunicationDtos.AutomationRuleUpdateRequest;
import np.com.lims.communication.entity.SmsAutomationEvent;
import np.com.lims.communication.entity.SmsAutomationRule;
import np.com.lims.communication.entity.SmsMessageStatus;
import np.com.lims.communication.entity.SmsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Per-organization on/off switches for the 9 automated SMS events. Disabled by default for every
 * event (see {@code SmsAutomationRule}'s javadoc) — a row only exists once an administrator has
 * looked at the automation screen and (potentially) changed something, so {@link #list} fills in
 * a virtual, unsaved "disabled, no template" row for any event that has none yet rather than
 * writing placeholder rows nobody asked for.
 */
@Service
public class SmsAutomationRuleService {

    private static final String MODULE = "COMMUNICATION";

    private final SmsAutomationRuleRepository repository;
    private final SmsTemplateRepository templateRepository;
    private final SmsMessageRepository messageRepository;
    private final AuditService auditService;

    public SmsAutomationRuleService(SmsAutomationRuleRepository repository, SmsTemplateRepository templateRepository,
                                    SmsMessageRepository messageRepository, AuditService auditService) {
        this.repository = repository;
        this.templateRepository = templateRepository;
        this.messageRepository = messageRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public java.util.List<AutomationRuleResponse> list() {
        Map<SmsAutomationEvent, SmsAutomationRule> existing = repository.findAllByOrderByEventTypeAsc().stream()
                .collect(Collectors.toMap(SmsAutomationRule::getEventType, r -> r));
        return Arrays.stream(SmsAutomationEvent.values())
                .map(event -> existing.containsKey(event) ? toResponse(existing.get(event)) : virtualResponse(event))
                .toList();
    }

    @Transactional
    public AutomationRuleResponse update(SmsAutomationEvent eventType, AutomationRuleUpdateRequest request) {
        SmsAutomationRule rule = repository.findByEventType(eventType)
                .orElseGet(() -> SmsAutomationRule.createFor(eventType));
        SmsTemplate template = request.templateId() == null ? null
                : templateRepository.findById(request.templateId())
                        .orElseThrow(() -> ApiException.notFound("SmsTemplate", request.templateId()));
        if (request.enabled() && template == null) {
            throw new ApiException(np.com.lims.common.exception.ErrorCode.VALIDATION_FAILED,
                    "Choose a template before enabling this automated notification.");
        }
        if (eventType == SmsAutomationEvent.APPOINTMENT_REMINDER
                && request.enabled() && (request.reminderOffsetHours() == null || request.reminderOffsetHours() < 1)) {
            throw new ApiException(np.com.lims.common.exception.ErrorCode.VALIDATION_FAILED,
                    "Set how many hours before the appointment the reminder should be sent.");
        }
        rule.update(request.enabled(), template, request.reminderOffsetHours());
        rule = repository.save(rule);
        auditService.record(MODULE, request.enabled() ? "ENABLE_AUTOMATION" : "DISABLE_AUTOMATION",
                "SmsAutomationRule", rule.getId(), (request.enabled() ? "Enabled" : "Disabled")
                        + " automated SMS for " + label(eventType), null, null);
        return toResponse(rule);
    }

    private AutomationRuleResponse virtualResponse(SmsAutomationEvent event) {
        return new AutomationRuleResponse(null, event, label(event), false, null, null, null, 0, 0);
    }

    private AutomationRuleResponse toResponse(SmsAutomationRule r) {
        long fired = r.getId() == null ? 0 : messageRepository.countByAutomationRuleId(r.getId());
        long failed = r.getId() == null ? 0 : messageRepository.countByAutomationRuleIdAndStatus(r.getId(), SmsMessageStatus.FAILED);
        return new AutomationRuleResponse(r.getId(), r.getEventType(), label(r.getEventType()), r.isEnabled(),
                r.getTemplate() == null ? null : r.getTemplate().getId(),
                r.getTemplate() == null ? null : r.getTemplate().getName(), r.getReminderOffsetHours(), fired, failed);
    }

    private static String label(SmsAutomationEvent event) {
        String[] words = event.name().split("_");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(w.charAt(0)).append(w.substring(1).toLowerCase(Locale.ROOT));
        }
        return sb.toString();
    }
}
