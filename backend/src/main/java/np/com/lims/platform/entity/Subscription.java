package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.time.Instant;

/** One clinic's subscription to a plan — the current record of what they're on and its status. */
@Entity
@Table(name = "subscription")
public class Subscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    /**
     * A clinic-requested plan change, queued until the current billing period ends — never
     * applied immediately, so it can't retroactively affect an invoice already issued for the
     * period in progress. Applied by {@code SubscriptionBillingService.generateDueInvoices()}.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pending_plan_id")
    private SubscriptionPlan pendingPlan;

    @Column(name = "pending_plan_requested_at")
    private Instant pendingPlanRequestedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status = SubscriptionStatus.TRIALING;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(length = 500)
    private String note;

    protected Subscription() {
    }

    public static Subscription start(Organization organization, SubscriptionPlan plan, SubscriptionStatus status,
                                     Instant currentPeriodEnd, String note) {
        Subscription s = new Subscription();
        s.organization = organization;
        s.plan = plan;
        s.status = status;
        s.startedAt = Instant.now();
        s.currentPeriodEnd = currentPeriodEnd;
        s.note = note;
        return s;
    }

    public void changePlan(SubscriptionPlan plan) {
        this.plan = plan;
    }

    public void changeStatus(SubscriptionStatus status) {
        this.status = status;
        if (status == SubscriptionStatus.CANCELLED) {
            this.cancelledAt = Instant.now();
        }
    }

    public void cancel(String reason) {
        this.status = SubscriptionStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancelReason = reason;
    }

    public void renewUntil(Instant periodEnd) {
        this.currentPeriodEnd = periodEnd;
        if (this.status == SubscriptionStatus.PAST_DUE || this.status == SubscriptionStatus.TRIALING) {
            this.status = SubscriptionStatus.ACTIVE;
        }
    }

    /**
     * Advances the billing period WITHOUT touching status — used when
     * {@code SubscriptionBillingService} automatically issues the next period's invoice. Unlike
     * {@link #renewUntil}, this must never flip TRIALING/PAST_DUE to ACTIVE: issuing an invoice is
     * not the same as being paid, and doing so here would let an unpaid clinic look "active" the
     * moment its next bill is generated, defeating the whole point of billing enforcement.
     */
    public void extendPeriodOnly(Instant periodEnd) {
        this.currentPeriodEnd = periodEnd;
    }

    /** Queues a plan change for the clinic itself to request — see {@link #pendingPlan}'s javadoc. */
    public void requestPlanChange(SubscriptionPlan newPlan) {
        this.pendingPlan = newPlan;
        this.pendingPlanRequestedAt = Instant.now();
    }

    public void cancelPendingPlanChange() {
        this.pendingPlan = null;
        this.pendingPlanRequestedAt = null;
    }

    /**
     * Called only by the billing sweep when a period rolls over — swaps in the queued plan (if
     * any) and clears the pending state. Returns whether a change was actually applied, so the
     * caller knows whether to bill the new plan's price for the period it's about to issue.
     */
    public boolean applyPendingPlanChangeIfAny() {
        if (pendingPlan == null) {
            return false;
        }
        this.plan = pendingPlan;
        this.pendingPlan = null;
        this.pendingPlanRequestedAt = null;
        return true;
    }

    public Organization getOrganization() {
        return organization;
    }

    public SubscriptionPlan getPlan() {
        return plan;
    }

    public SubscriptionPlan getPendingPlan() {
        return pendingPlan;
    }

    public Instant getPendingPlanRequestedAt() {
        return pendingPlanRequestedAt;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCurrentPeriodEnd() {
        return currentPeriodEnd;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public String getNote() {
        return note;
    }
}
