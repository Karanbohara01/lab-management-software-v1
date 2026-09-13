-- A dedicated PLATFORM_ADMIN role for a true platform-only operator — someone who onboards and
-- manages clinics/subscriptions but has no access to any clinic's own operational data (patients,
-- orders, billing, etc.). Deliberately granted ONLY PLATFORM_MANAGE, nothing else — per the
-- "new permission/role grants aren't retroactive" lesson, explicit here rather than relying on
-- any blanket grant. SUPER_ADMIN keeps its existing full access (it doubles as this deployment's
-- 'primary' clinic admin today) — this is an additional, narrower role alongside it, not a
-- replacement.

INSERT INTO role (name, description, created_at, updated_at, created_by, updated_by)
VALUES ('PLATFORM_ADMIN', 'Platform-level only — onboards and manages clinics/subscriptions, no clinic operational access', NOW(6), NOW(6), 'system', 'system');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'PLATFORM_ADMIN' AND p.name = 'PLATFORM_MANAGE';
