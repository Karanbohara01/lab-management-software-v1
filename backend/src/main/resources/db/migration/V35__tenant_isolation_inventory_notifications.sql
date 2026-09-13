-- Phase 1 of tenant isolation, slice 4: inventory_item, supplier, purchase_order, notification —
-- all four have their own repository with direct cross-parent queries, so each gets its own
-- organization_id (same reasoning as refund/ird_submission/online_payment in V34). Child tables
-- (inventory_batch, stock_transaction, purchase_order_item) are NOT given their own column —
-- no standalone repository/cross-parent query exists for them.

-- ----- supplier --------------------------------------------------------------

ALTER TABLE supplier ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE supplier SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE supplier MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE supplier ADD CONSTRAINT fk_supplier_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_supplier_org ON supplier(organization_id);

-- ----- inventory_item ----------------------------------------------------------

ALTER TABLE inventory_item ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE inventory_item SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE inventory_item MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE inventory_item ADD CONSTRAINT fk_inventory_item_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE inventory_item DROP INDEX uq_inventory_item_code;
ALTER TABLE inventory_item ADD CONSTRAINT uq_inventory_item_code UNIQUE (organization_id, code);
CREATE INDEX idx_inventory_item_org ON inventory_item(organization_id);

-- ----- purchase_order ----------------------------------------------------------

ALTER TABLE purchase_order ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE purchase_order SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE purchase_order MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE purchase_order ADD CONSTRAINT fk_purchase_order_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE purchase_order DROP INDEX uq_purchase_order_number;
ALTER TABLE purchase_order ADD CONSTRAINT uq_purchase_order_number UNIQUE (organization_id, po_number);
CREATE INDEX idx_purchase_order_org ON purchase_order(organization_id);

-- ----- notification ----------------------------------------------------------
-- Notification deliberately doesn't extend BaseEntity (no version/updated_at/created_by columns
-- by design, see np.com.lims.notification.entity.Notification) — organization_id is added the
-- same way regardless.

ALTER TABLE notification ADD COLUMN organization_id BIGINT NULL AFTER id;
UPDATE notification SET organization_id = (SELECT id FROM organization WHERE slug = 'primary') WHERE organization_id IS NULL;
ALTER TABLE notification MODIFY organization_id BIGINT NOT NULL;
ALTER TABLE notification ADD CONSTRAINT fk_notification_org FOREIGN KEY (organization_id) REFERENCES organization(id);
CREATE INDEX idx_notification_org ON notification(organization_id);
