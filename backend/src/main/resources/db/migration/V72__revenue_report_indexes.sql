-- ---------------------------------------------------------------------------
-- V72  Indexes for the revenue dashboard and printed revenue report.
--
--      Every revenue figure is cut by one of three transaction dates — the
--      invoice's issued_at (what was billed), the payment's received_at (what
--      was collected) and the refund's decided_at (what was returned) — and
--      none of them was indexed: invoice only carried created_at, payment only
--      its invoice FK, refund only its status. Each date-ranged aggregate was a
--      full scan of its table. The statutory Sales Book / Master Bill /
--      Corrections reports filter the same issued_at / cancelled_at columns and
--      benefit equally.
--
--      Leading with organization_id and status matches how every query
--      constrains these rows (tenant first, then the lifecycle state, then the
--      range). payment has no organization_id by design (it is reached through
--      its invoice), so its index is the bare timestamp.
-- ---------------------------------------------------------------------------

CREATE INDEX ix_invoice_issued_at    ON invoice (organization_id, status, issued_at);
CREATE INDEX ix_invoice_cancelled_at ON invoice (organization_id, status, cancelled_at);
CREATE INDEX ix_payment_received_at  ON payment (received_at);
CREATE INDEX ix_refund_decided_at    ON refund  (organization_id, status, decided_at);
