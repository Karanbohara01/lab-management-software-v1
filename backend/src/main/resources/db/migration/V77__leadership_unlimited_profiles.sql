-- The leadership profiles were two fixed rows (slot CEO / COO). Administrators can now add and
-- remove leaders, so a profile is identified by its id and its place on the page by display_order.
-- The two existing rows (and everything saved on them) are kept as they are; dropping the column
-- also drops its unique index.
ALTER TABLE leadership_profile DROP COLUMN slot;
