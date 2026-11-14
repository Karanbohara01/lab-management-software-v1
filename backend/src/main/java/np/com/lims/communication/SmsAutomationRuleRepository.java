package np.com.lims.communication;

import np.com.lims.communication.entity.SmsAutomationEvent;
import np.com.lims.communication.entity.SmsAutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SmsAutomationRuleRepository extends JpaRepository<SmsAutomationRule, Long> {

    List<SmsAutomationRule> findAllByOrderByEventTypeAsc();

    Optional<SmsAutomationRule> findByEventType(SmsAutomationEvent eventType);

    /**
     * Across EVERY organization, ignoring the tenant filter — for the reminder/follow-up sweeps,
     * which run with no tenant context of their own and must find which orgs even have the rule
     * enabled before looping into each one. Native query deliberately bypasses the Hibernate
     * tenantFilter (never enabled outside a request/explicit TenantContext anyway).
     */
    @org.springframework.data.jpa.repository.Query(value =
            "SELECT organization_id FROM sms_automation_rule WHERE event_type = :eventType AND enabled = TRUE",
            nativeQuery = true)
    List<Long> findEnabledOrganizationIds(String eventType);
}
