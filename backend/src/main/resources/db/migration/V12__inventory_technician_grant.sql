-- ---------------------------------------------------------------------------
-- V12  Let laboratory technicians receive and issue stock (they run the bench).
-- ---------------------------------------------------------------------------

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.name = 'INVENTORY_WRITE'
WHERE r.name = 'LAB_TECHNICIAN'
  AND NOT EXISTS (
        SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
