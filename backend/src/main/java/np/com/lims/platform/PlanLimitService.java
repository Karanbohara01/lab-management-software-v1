package np.com.lims.platform;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.platform.entity.Subscription;
import np.com.lims.platform.entity.SubscriptionPlan;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Enforces the {@code max_users}/{@code max_branches} seat limits on the current organization's
 * subscription plan — the plan has always carried these numbers, but until now nothing anywhere
 * actually checked them, so every clinic behaved as if it had unlimited seats regardless of the
 * plan it was on. A clinic with no subscription row at all (shouldn't happen post-onboarding, but
 * not fatal here) is treated as unlimited rather than zero, since failing closed would be a worse
 * failure mode than failing open for a data state that should be impossible.
 */
@Service
public class PlanLimitService {

    private final SubscriptionRepository subscriptionRepository;

    public PlanLimitService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional(readOnly = true)
    public void requireUserCapacity(long currentUserCount) {
        currentPlan().ifPresent(plan -> {
            if (currentUserCount >= plan.getMaxUsers()) {
                throw ApiException.conflict("This clinic's " + plan.getName()
                        + " plan allows up to " + plan.getMaxUsers() + " user account(s) ("
                        + currentUserCount + " already exist). Upgrade the plan or deactivate an "
                        + "existing user before adding another.");
            }
        });
    }

    @Transactional(readOnly = true)
    public void requireBranchCapacity(long currentBranchCount) {
        currentPlan().ifPresent(plan -> {
            if (currentBranchCount >= plan.getMaxBranches()) {
                throw ApiException.conflict("This clinic's " + plan.getName()
                        + " plan allows up to " + plan.getMaxBranches() + " branch(es) ("
                        + currentBranchCount + " already exist). Upgrade the plan to add another branch.");
            }
        });
    }

    private java.util.Optional<SubscriptionPlan> currentPlan() {
        Long orgId = TenantContext.require();
        return subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(orgId)
                .map(Subscription::getPlan);
    }
}
