package np.com.lims.communication;

import np.com.lims.appointment.AppointmentRepository;
import np.com.lims.appointment.entity.Appointment;
import np.com.lims.appointment.entity.AppointmentStatus;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.communication.entity.FollowUpStatus;
import np.com.lims.communication.entity.PatientFollowUp;
import np.com.lims.communication.entity.SmsAutomationEvent;
import np.com.lims.communication.entity.SmsAutomationRule;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Fires the two automation events that have no single "the moment this becomes true" action to
 * hang a direct call off of: {@code APPOINTMENT_REMINDER} (a point in time before a scheduled
 * visit) and {@code FOLLOW_UP_DUE} (a date arriving). Built on {@code NotificationSweeper}'s own
 * documented pattern — looping organizations with {@link TenantContext} set explicitly per one,
 * calling through the injected self-proxy into a {@code REQUIRES_NEW} transaction so one
 * organization's failure can never roll back another's — for the same reason that sweeper gives:
 * a shared transaction across organizations was tried elsewhere in this codebase and found to
 * silently discard every other organization's work when one threw.
 *
 * <p>Scoped to only the organizations that actually have each rule enabled
 * ({@code SmsAutomationRuleRepository#findEnabledOrganizationIds}, which bypasses the Hibernate
 * tenant filter deliberately — see that repository) rather than looping every organization and
 * checking inside, since most won't have either rule turned on.
 */
@Component
public class SmsReminderSweep {

    private static final Logger log = LoggerFactory.getLogger(SmsReminderSweep.class);

    private final SmsAutomationRuleRepository ruleRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientFollowUpRepository followUpRepository;
    private final PatientRepository patientRepository;
    private final SmsAutomationTriggerService triggerService;
    private final SmsReminderSweep self;

    public SmsReminderSweep(SmsAutomationRuleRepository ruleRepository, AppointmentRepository appointmentRepository,
                            PatientFollowUpRepository followUpRepository, PatientRepository patientRepository,
                            SmsAutomationTriggerService triggerService, @Lazy SmsReminderSweep self) {
        this.ruleRepository = ruleRepository;
        this.appointmentRepository = appointmentRepository;
        this.followUpRepository = followUpRepository;
        this.patientRepository = patientRepository;
        this.triggerService = triggerService;
        this.self = self;
    }

    @Scheduled(cron = "${lims.sms.reminder-sweep-cron:0 */15 * * * *}")
    public void sweep() {
        sweepAppointmentReminders();
        sweepFollowUps();
    }

    private void sweepAppointmentReminders() {
        for (Long orgId : ruleRepository.findEnabledOrganizationIds(SmsAutomationEvent.APPOINTMENT_REMINDER.name())) {
            TenantContext.set(orgId);
            try {
                self.sweepAppointmentRemindersForOrg(orgId);
            } catch (RuntimeException e) {
                log.warn("Appointment reminder sweep failed for organization {}: {}", orgId, e.toString());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sweepAppointmentRemindersForOrg(Long orgId) {
        SmsAutomationRule rule = ruleRepository.findByOrganizationIdAndEventType(orgId, SmsAutomationEvent.APPOINTMENT_REMINDER).orElse(null);
        if (rule == null || !rule.isEnabled() || rule.getTemplate() == null) {
            return;
        }
        int offsetHours = rule.getReminderOffsetHours() == null ? 24 : rule.getReminderOffsetHours();
        Instant now = Instant.now();
        List<Appointment> due = appointmentRepository.findByStatusInAndScheduledAtBetweenAndReminderSentAtIsNull(
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN), now, now.plus(offsetHours, ChronoUnit.HOURS));
        for (Appointment appointment : due) {
            triggerService.appointmentReminderDue(appointment);
            appointment.markReminderSent();
            appointmentRepository.save(appointment);
        }
    }

    private void sweepFollowUps() {
        for (Long orgId : ruleRepository.findEnabledOrganizationIds(SmsAutomationEvent.FOLLOW_UP_DUE.name())) {
            TenantContext.set(orgId);
            try {
                self.sweepFollowUpsForOrg(orgId);
            } catch (RuntimeException e) {
                log.warn("Follow-up reminder sweep failed for organization {}: {}", orgId, e.toString());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sweepFollowUpsForOrg(Long orgId) {
        SmsAutomationRule rule = ruleRepository.findByOrganizationIdAndEventType(orgId, SmsAutomationEvent.FOLLOW_UP_DUE).orElse(null);
        if (rule == null || !rule.isEnabled() || rule.getTemplate() == null) {
            return;
        }
        List<PatientFollowUp> due = followUpRepository.findByStatusAndDueDateLessThanEqualAndReminderSentAtIsNull(
                FollowUpStatus.PENDING, LocalDate.now());
        for (PatientFollowUp followUp : due) {
            Patient patient = patientRepository.findById(followUp.getPatientId()).orElse(null);
            if (patient != null) {
                triggerService.followUpDue(patient, followUp.getDueDate(), followUp.getReason());
            }
            followUp.markReminderSent();
            followUpRepository.save(followUp);
        }
    }
}
