-- Platform layer: the registry of clinics ("organizations") this deployment could one day host as
-- separate paying tenants, plus their subscription plan/status. This migration adds the REGISTRY
-- only — it does not (yet) partition existing data (patients, orders, results, invoices, users...)
-- by organization. Today's app remains a single shared dataset; this table lets a platform owner
-- track and administer prospective/onboarded clinics and their subscriptions ahead of that larger,
-- separate data-isolation migration.

CREATE TABLE subscription_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    price_monthly DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_users INT NOT NULL,
    max_branches INT NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE organization (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    contact_name VARCHAR(160),
    contact_email VARCHAR(160),
    contact_phone VARCHAR(32),
    city VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    notes VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE subscription (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TRIALING',
    started_at DATETIME(6) NOT NULL,
    current_period_end DATETIME(6),
    cancelled_at DATETIME(6),
    cancel_reason VARCHAR(500),
    note VARCHAR(500),
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_subscription_org FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plan(id)
) ENGINE=InnoDB;

CREATE INDEX idx_subscription_org ON subscription(organization_id);

INSERT INTO subscription_plan (code, name, price_monthly, max_users, max_branches, description, display_order, created_at, updated_at, created_by, updated_by)
VALUES
 ('STARTER', 'Starter', 4999.00, 5, 1, 'Single-location labs getting started.', 1, NOW(6), NOW(6), 'system', 'system'),
 ('PROFESSIONAL', 'Professional', 12999.00, 25, 5, 'Multi-branch labs with billing and IRD e-billing.', 2, NOW(6), NOW(6), 'system', 'system'),
 ('ENTERPRISE', 'Enterprise', 34999.00, 999, 999, 'Large chains — unlimited users/branches, priority support.', 3, NOW(6), NOW(6), 'system', 'system');

-- New permission for the platform-level control center. Per the "new permission grants aren't
-- retroactive" lesson: explicitly grant it to SUPER_ADMIN here rather than relying on any older
-- blanket grant.
INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by)
VALUES ('PLATFORM_MANAGE', 'Manage clinics (organizations) and subscriptions', NOW(6), NOW(6), 'system', 'system');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'SUPER_ADMIN' AND p.name = 'PLATFORM_MANAGE';
