package np.com.lims.communication;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.communication.dto.CommunicationDtos.TemplateRequest;
import np.com.lims.communication.dto.CommunicationDtos.TemplateResponse;
import np.com.lims.communication.entity.SmsAutomationEvent;
import np.com.lims.communication.entity.SmsAutomationRule;
import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** CRUD for reusable SMS templates — used by automation rules, campaigns, and the manual send screen. */
@Service
public class SmsTemplateService {

    private static final String MODULE = "COMMUNICATION";

    private final SmsTemplateRepository repository;
    private final SmsAutomationRuleRepository ruleRepository;
    private final AuditService auditService;

    public SmsTemplateService(SmsTemplateRepository repository, SmsAutomationRuleRepository ruleRepository, AuditService auditService) {
        this.repository = repository;
        this.ruleRepository = ruleRepository;
        this.auditService = auditService;
    }

    /** Provision default templates and enable core automation rules for a newly created organization. */
    @Transactional
    public void seedDefaults(Long organizationId) {
        SmsTemplate reg = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Patient Registration Welcome", SmsCategory.REGISTRATION,
                "Dear {patientName}, welcome to {labName}. Your registration is complete. Your Patient ID (MRN) is {mrn}. Please keep this ID for test bookings and report collection."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.PATIENT_REGISTERED, true, reg, null));

        SmsTemplate report = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Diagnostic Report Ready", SmsCategory.REPORT_READY,
                "Dear {patientName}, your test report {reportNumber} from {labName} is now ready. You may collect your printed copy at the lab or view it online. Thank you."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.REPORT_READY, true, report, null));

        SmsTemplate order = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Lab Order Confirmed", SmsCategory.LABORATORY,
                "Dear {patientName}, your diagnostic lab order {orderNumber} has been confirmed at {labName}. Your specimens are currently being processed."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.LAB_ORDER_CONFIRMED, true, order, null));

        SmsTemplate payment = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Payment Received Confirmation", SmsCategory.PAYMENT,
                "Dear {patientName}, payment of NPR {amount} for Invoice #{invoiceNumber} has been received by {labName}. Thank you for your payment."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.PAYMENT_COMPLETED, true, payment, null));

        SmsTemplate appt = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Appointment Confirmation", SmsCategory.APPOINTMENT,
                "Dear {patientName}, your lab appointment at {labName} is confirmed for {appointmentDate} at {appointmentTime}. Your MRN is {mrn}. Thank you."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.APPOINTMENT_BOOKED, true, appt, null));

        SmsTemplate reminder = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Appointment Reminder", SmsCategory.APPOINTMENT,
                "Dear {patientName}, this is a reminder for your upcoming diagnostic appointment at {labName} on {appointmentDate} at {appointmentTime}."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.APPOINTMENT_REMINDER, true, reminder, 24));

        SmsTemplate rescheduled = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Appointment Rescheduled", SmsCategory.APPOINTMENT,
                "Dear {patientName}, your lab appointment at {labName} has been rescheduled to {appointmentDate} at {appointmentTime}. Your MRN is {mrn}. Thank you."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.APPOINTMENT_RESCHEDULED, true, rescheduled, null));

        SmsTemplate cancelled = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Appointment Cancelled", SmsCategory.APPOINTMENT,
                "Dear {patientName}, your lab appointment scheduled for {appointmentDate} at {appointmentTime} at {labName} has been cancelled. Please contact us if you wish to reschedule."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.APPOINTMENT_CANCELLED, true, cancelled, null));

        SmsTemplate followUp = repository.save(SmsTemplate.createForOrganization(organizationId,
                "Follow Up Due", SmsCategory.FOLLOW_UP,
                "Dear {patientName}, this is a reminder from {labName} that your follow-up check is due on {dueDate}. Reason: {reason}. Please contact us if you need assistance."));
        ruleRepository.save(SmsAutomationRule.createForOrganization(organizationId,
                SmsAutomationEvent.FOLLOW_UP_DUE, true, followUp, null));
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
