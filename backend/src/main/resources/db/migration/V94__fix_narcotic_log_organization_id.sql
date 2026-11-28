-- V94: Fix pharmacy_narcotic_log organization_id column mapping

ALTER TABLE `pharmacy_narcotic_log`
    ADD COLUMN `organization_id` BIGINT NOT NULL DEFAULT 1;
