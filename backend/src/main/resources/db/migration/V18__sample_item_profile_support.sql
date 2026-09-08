-- ---------------------------------------------------------------------------
-- V18  A profile order item expands to one sample item per member test, so a
--      lab_order_item may now back several sample items. Replace the unique
--      constraint with a plain index (created first so the FK can switch to it).
-- ---------------------------------------------------------------------------

CREATE INDEX ix_sample_item_order_item ON sample_item (lab_order_item_id);
ALTER TABLE sample_item DROP INDEX uq_sample_item_order_item;
