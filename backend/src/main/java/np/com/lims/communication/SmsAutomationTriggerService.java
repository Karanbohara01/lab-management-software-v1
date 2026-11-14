package np.com.lims.communication;

import np.com.lims.appointment.entity.Appointment;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.communication.entity.SmsAutomationEvent;
import np.com.lims.communication.entity.SmsAutomationRule;
import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsTemplate;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.entity.Patient;
import np.com.lims.report.entity.Report;
import np.com.lims.settings.LaboratoryProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * The single collaborator every other service calls into for automated SMS — this codebase has
 * no event bus (see the architecture notes on {@code TenantContext}/{@code AuditService}), so
 * every cross-cutting concern is an explicit, direct method call from the triggering action,
 * right alongside its existing {@code auditService.record(...)} call. Every method here is a
 * one-line addition at each of those call sites: {@code PatientService#register},
 * {@code AppointmentService#book/#reschedule/#cancel}, {@code LabOrderService#confirm},
 * {@code ReportService#release}, {@code InvoiceService#recordPayment} (only once the balance
 * reaches zero — see {@link #paymentCompleted}).
 *
 * <p>Never throws: a missing phone number, a disabled or unconfigured rule, or even an
 * unexpected failure inside the send pipeline must never block the real action (registering a
 * patient, confirming an order, releasing a report) it's attached to. Anything unexpected is
 * logged and swallowed here, not propagated — the one deliberate exception already built into
 * {@code SmsMessageService#send} is that it runs in its own transaction, so this can never poison
 * the caller's.
 */
@Service
public class SmsAutomationTriggerService {

    private static final Logger log = LoggerFactory.getLogger(SmsAutomationTriggerService.class);

    private final SmsAutomationRuleRepository ruleRepository;
    private final SmsMessageService messageService;
    private final LaboratoryProfileService laboratoryProfileService;

    public SmsAutomationTriggerService(SmsAutomationRuleRepository ruleRepository, SmsMessageService messageService,
                                       LaboratoryProfileService laboratoryProfileService) {
        this.ruleRepository = ruleRepository;
        this.messageService = messageService;
        this.laboratoryProfileService = laboratoryProfileService;
    }

    public void patientRegistered(Patient patient) {
        fire(SmsAutomationEvent.PATIENT_REGISTERED, patient, SmsCategory.REGISTRATION, Map.of());
    }

    public void appointmentBooked(Appointment appointment) {
        fire(SmsAutomationEvent.APPOINTMENT_BOOKED, appointment.getPatient(), SmsCategory.APPOINTMENT,
                appointmentPlaceholders(appointment));
    }

    public void appointmentRescheduled(Appointment appointment) {
        fire(SmsAutomationEvent.APPOINTMENT_RESCHEDULED, appointment.getPatient(), SmsCategory.APPOINTMENT,
                appointmentPlaceholders(appointment));
    }

    public void appointmentCancelled(Appointment appointment) {
        fire(SmsAutomationEvent.APPOINTMENT_CANCELLED, appointment.getPatient(), SmsCategory.APPOINTMENT,
                appointmentPlaceholders(appointment));
    }

    /** Fired by {@code SmsReminderSweep}, not from a direct action — see that class for the due-window query. */
    public void appointmentReminderDue(Appointment appointment) {
        fire(SmsAutomationEvent.APPOINTMENT_REMINDER, appointment.getPatient(), SmsCategory.APPOINTMENT,
                appointmentPlaceholders(appointment));
    }

    /** Fired by {@code SmsReminderSweep}, not from a direct action — see that class for the due-window query. */
    public void followUpDue(Patient patient, java.time.LocalDate dueDate, String reason) {
        Map<String, String> extra = new HashMap<>();
        extra.put("dueDate", dueDate.toString());
        if (reason != null) {
            extra.put("reason", reason);
        }
        fire(SmsAutomationEvent.FOLLOW_UP_DUE, patient, SmsCategory.FOLLOW_UP, extra);
    }

    public void labOrderConfirmed(LabOrder order) {
        fire(SmsAutomationEvent.LAB_ORDER_CONFIRMED, order.getPatient(), SmsCategory.LABORATORY,
                Map.of("orderNumber", order.getOrderNumber()));
    }

    public void reportReady(Report report) {
        fire(SmsAutomationEvent.REPORT_READY, report.getPatient(), SmsCategory.REPORT_READY,
                Map.of("reportNumber", report.getReportNumber()));
    }

    /** Only call once the invoice's balance has actually reached zero — never on a partial payment. */
    public void paymentCompleted(Invoice invoice) {
        fire(SmsAutomationEvent.PAYMENT_COMPLETED, invoice.getPatient(), SmsCategory.PAYMENT,
                Map.of("invoiceNumber", invoice.getInvoiceNumber(), "amount", invoice.getTotalAmount().toPlainString()));
    }

    private Map<String, String> appointmentPlaceholders(Appointment appointment) {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH).withZone(ZoneId.of("Asia/Kathmandu"));
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH).withZone(ZoneId.of("Asia/Kathmandu"));
        Map<String, String> placeholders = new HashMap<>();
        placeholders.put("appointmentDate", dateFmt.format(appointment.getScheduledAt()));
        placeholders.put("appointmentTime", timeFmt.format(appointment.getScheduledAt()));
        if (appointment.getReferringDoctor() != null) {
            placeholders.put("doctorName", appointment.getReferringDoctor().getFullName());
        }
        return placeholders;
    }

    private void fire(SmsAutomationEvent event, Patient patient, SmsCategory category, Map<String, String> extra) {
        try {
            if (patient == null || patient.getPhone() == null || patient.getPhone().isBlank()) {
                return;
            }
            SmsAutomationRule rule = ruleRepository.findByEventType(event).orElse(null);
            if (rule == null || !rule.isEnabled()) {
                return;
            }
            SmsTemplate template = rule.getTemplate();
            if (template == null || !template.isActive()) {
                log.warn("Automation rule for {} is enabled but has no active template — nothing sent", event);
                return;
            }
            Map<String, String> placeholders = new HashMap<>(extra);
            placeholders.put("patientName", patient.getFullName());
            placeholders.put("mrn", patient.getMrn());
            placeholders.put("labName", laboratoryProfileService.require().getName());

            String body = SmsPlaceholderResolver.resolve(template.getBody(), placeholders);
            messageService.send(SmsMessageService.SendCommand.automated(
                    patient.getId(), patient.getPhone(), patient.getFullName(), category, body, rule));
        } catch (RuntimeException e) {
            log.error("Automated SMS for event {} failed unexpectedly — the triggering action was not affected", event, e);
        }
    }
}
