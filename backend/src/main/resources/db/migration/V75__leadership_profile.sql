-- The two leadership profiles shown in the landing page's "About us" section (CEO & Founder,
-- COO & Co-Founder). Platform-level content — one set for the whole product, not per clinic — so
-- no organization_id. The rows are fixed (one per slot) and edited by a platform administrator;
-- a profile with a blank name is simply not shown on the public site.
CREATE TABLE leadership_profile (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    slot           VARCHAR(20)  NOT NULL UNIQUE,
    name           VARCHAR(160) NOT NULL DEFAULT '',
    title          VARCHAR(120) NOT NULL,
    description    VARCHAR(600) NULL,
    photo_data_uri MEDIUMTEXT   NULL,
    display_order  INT          NOT NULL DEFAULT 0,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100)
) ENGINE=InnoDB;

-- Names are deliberately left blank: they are set from the platform admin's Leadership page, and
-- nothing is shown publicly until they are. The descriptions describe the roles only.
INSERT INTO leadership_profile (slot, name, title, description, display_order, created_at, updated_at, created_by, updated_by)
VALUES
 ('CEO', '', 'CEO & Founder',
  'Sets the vision and direction of the company and its products, and works with laboratories to make sure the software fits the way they really work.',
  1, NOW(6), NOW(6), 'system', 'system'),
 ('COO', '', 'COO & Co-Founder',
  'Runs day-to-day operations — from onboarding and training to support and delivery — so every laboratory gets the most out of the platform.',
  2, NOW(6), NOW(6), 'system', 'system');
