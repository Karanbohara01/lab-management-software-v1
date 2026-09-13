-- A clinic-requested plan change is queued here rather than applied immediately, so it never
-- retroactively affects an already-issued invoice or mid-period feature access — it's applied by
-- the same daily sweep that rolls the billing period over (SubscriptionBillingService.generateDueInvoices).
ALTER TABLE subscription
    ADD COLUMN pending_plan_id BIGINT NULL AFTER plan_id,
    ADD COLUMN pending_plan_requested_at DATETIME(6) NULL AFTER pending_plan_id,
    ADD CONSTRAINT fk_subscription_pending_plan FOREIGN KEY (pending_plan_id) REFERENCES subscription_plan(id);
