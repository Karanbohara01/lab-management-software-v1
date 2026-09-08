-- ---------------------------------------------------------------------------
-- V2  RBAC baseline: canonical permissions, roles and their grants.
--     This is reference data (not dev seed) - it must exist in every environment.
-- ---------------------------------------------------------------------------

INSERT INTO permission (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('PATIENT_READ','View patients',NOW(6),NOW(6),'system','system'),
 ('PATIENT_WRITE','Create / update patients',NOW(6),NOW(6),'system','system'),
 ('DOCTOR_READ','View referring doctors',NOW(6),NOW(6),'system','system'),
 ('DOCTOR_WRITE','Manage referring doctors',NOW(6),NOW(6),'system','system'),
 ('DEPARTMENT_READ','View departments',NOW(6),NOW(6),'system','system'),
 ('DEPARTMENT_WRITE','Manage departments',NOW(6),NOW(6),'system','system'),
 ('TEST_CATALOG_READ','View test catalogue',NOW(6),NOW(6),'system','system'),
 ('TEST_CATALOG_WRITE','Manage test catalogue',NOW(6),NOW(6),'system','system'),
 ('LAB_ORDER_READ','View lab orders',NOW(6),NOW(6),'system','system'),
 ('LAB_ORDER_WRITE','Create / update lab orders',NOW(6),NOW(6),'system','system'),
 ('SAMPLE_READ','View samples',NOW(6),NOW(6),'system','system'),
 ('SAMPLE_COLLECT','Record sample collection',NOW(6),NOW(6),'system','system'),
 ('SAMPLE_RECEIVE','Receive samples into the lab',NOW(6),NOW(6),'system','system'),
 ('SAMPLE_REJECT','Reject / request recollection',NOW(6),NOW(6),'system','system'),
 ('RESULT_READ','View results',NOW(6),NOW(6),'system','system'),
 ('RESULT_ENTER','Enter results',NOW(6),NOW(6),'system','system'),
 ('RESULT_VERIFY','Technician verification of results',NOW(6),NOW(6),'system','system'),
 ('RESULT_APPROVE','Pathologist approval of results',NOW(6),NOW(6),'system','system'),
 ('RESULT_AMEND','Amend approved results',NOW(6),NOW(6),'system','system'),
 ('REPORT_READ','View reports',NOW(6),NOW(6),'system','system'),
 ('REPORT_GENERATE','Generate reports',NOW(6),NOW(6),'system','system'),
 ('REPORT_DELIVER','Deliver reports to patients / doctors',NOW(6),NOW(6),'system','system'),
 ('REPORT_TEMPLATE_MANAGE','Manage report templates',NOW(6),NOW(6),'system','system'),
 ('INVOICE_READ','View invoices',NOW(6),NOW(6),'system','system'),
 ('INVOICE_WRITE','Create / update invoices',NOW(6),NOW(6),'system','system'),
 ('INVOICE_CANCEL','Cancel invoices',NOW(6),NOW(6),'system','system'),
 ('PAYMENT_READ','View payments',NOW(6),NOW(6),'system','system'),
 ('PAYMENT_WRITE','Record payments',NOW(6),NOW(6),'system','system'),
 ('REFUND_REQUEST','Request refunds',NOW(6),NOW(6),'system','system'),
 ('REFUND_APPROVE','Approve refunds',NOW(6),NOW(6),'system','system'),
 ('IRD_SUBMISSION_READ','View IRD / e-billing submissions',NOW(6),NOW(6),'system','system'),
 ('IRD_SUBMISSION_MANAGE','Manage / retry IRD submissions',NOW(6),NOW(6),'system','system'),
 ('INVENTORY_READ','View inventory',NOW(6),NOW(6),'system','system'),
 ('INVENTORY_WRITE','Manage inventory and stock movements',NOW(6),NOW(6),'system','system'),
 ('NOTIFICATION_READ','View notifications',NOW(6),NOW(6),'system','system'),
 ('AUDIT_READ','View audit log',NOW(6),NOW(6),'system','system'),
 ('REPORTING_READ','View analytics and management reports',NOW(6),NOW(6),'system','system'),
 ('USER_READ','View users',NOW(6),NOW(6),'system','system'),
 ('USER_WRITE','Manage users',NOW(6),NOW(6),'system','system'),
 ('ROLE_READ','View roles',NOW(6),NOW(6),'system','system'),
 ('ROLE_WRITE','Manage roles and permissions',NOW(6),NOW(6),'system','system'),
 ('SETTINGS_READ','View settings',NOW(6),NOW(6),'system','system'),
 ('SETTINGS_WRITE','Manage settings',NOW(6),NOW(6),'system','system');

INSERT INTO role (name, description, created_at, updated_at, created_by, updated_by) VALUES
 ('SUPER_ADMIN','Full system access',NOW(6),NOW(6),'system','system'),
 ('LAB_ADMINISTRATOR','Operational administration',NOW(6),NOW(6),'system','system'),
 ('RECEPTIONIST','Front desk: patients, orders, billing, payments',NOW(6),NOW(6),'system','system'),
 ('LAB_TECHNICIAN','Samples, processing and result entry',NOW(6),NOW(6),'system','system'),
 ('PATHOLOGIST','Result verification, approval and report authorization',NOW(6),NOW(6),'system','system'),
 ('ACCOUNTANT','Invoices, payments, refunds and e-billing',NOW(6),NOW(6),'system','system'),
 ('DOCTOR','Referring doctor: referred patients and reports',NOW(6),NOW(6),'system','system'),
 ('SAMPLE_COLLECTION_STAFF','Sample collection and barcode tracking',NOW(6),NOW(6),'system','system');

-- SUPER_ADMIN: every permission
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p WHERE r.name = 'SUPER_ADMIN';

-- LAB_ADMINISTRATOR: everything except managing roles/permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'LAB_ADMINISTRATOR' AND p.name <> 'ROLE_WRITE';

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'RECEPTIONIST' AND p.name IN (
 'PATIENT_READ','PATIENT_WRITE','DOCTOR_READ','DEPARTMENT_READ','TEST_CATALOG_READ',
 'LAB_ORDER_READ','LAB_ORDER_WRITE','SAMPLE_READ',
 'INVOICE_READ','INVOICE_WRITE','PAYMENT_READ','PAYMENT_WRITE',
 'REPORT_READ','NOTIFICATION_READ');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'LAB_TECHNICIAN' AND p.name IN (
 'PATIENT_READ','DEPARTMENT_READ','TEST_CATALOG_READ','LAB_ORDER_READ',
 'SAMPLE_READ','SAMPLE_RECEIVE','SAMPLE_REJECT',
 'RESULT_READ','RESULT_ENTER','RESULT_VERIFY',
 'REPORT_READ','REPORT_GENERATE','INVENTORY_READ','NOTIFICATION_READ');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'PATHOLOGIST' AND p.name IN (
 'PATIENT_READ','DEPARTMENT_READ','TEST_CATALOG_READ','LAB_ORDER_READ','SAMPLE_READ',
 'RESULT_READ','RESULT_VERIFY','RESULT_APPROVE','RESULT_AMEND',
 'REPORT_READ','REPORT_GENERATE','REPORT_DELIVER','REPORT_TEMPLATE_MANAGE',
 'REPORTING_READ','NOTIFICATION_READ');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'ACCOUNTANT' AND p.name IN (
 'PATIENT_READ','LAB_ORDER_READ','REPORT_READ',
 'INVOICE_READ','INVOICE_WRITE','INVOICE_CANCEL',
 'PAYMENT_READ','PAYMENT_WRITE','REFUND_REQUEST','REFUND_APPROVE',
 'IRD_SUBMISSION_READ','IRD_SUBMISSION_MANAGE',
 'REPORTING_READ','NOTIFICATION_READ');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'DOCTOR' AND p.name IN (
 'PATIENT_READ','LAB_ORDER_READ','REPORT_READ','NOTIFICATION_READ');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p
WHERE r.name = 'SAMPLE_COLLECTION_STAFF' AND p.name IN (
 'PATIENT_READ','LAB_ORDER_READ','SAMPLE_READ','SAMPLE_COLLECT','NOTIFICATION_READ');
