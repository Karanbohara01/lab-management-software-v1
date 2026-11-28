-- V98: Add missing audit columns to pharmacy_purchase_order for BaseEntity schema validation
ALTER TABLE pharmacy_purchase_order ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE pharmacy_purchase_order ADD COLUMN updated_by VARCHAR(100);
