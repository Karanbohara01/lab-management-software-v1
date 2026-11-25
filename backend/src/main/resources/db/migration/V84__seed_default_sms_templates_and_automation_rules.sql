-- V84: Seed standard default SMS templates and enable automation rules out-of-the-box

-- 1. Seed Diagnostic Report Ready template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Diagnostic Report Ready', 'REPORT_READY', 
       'Dear {patientName}, your test report {reportNumber} from {labName} is now ready. You may collect your printed copy at the lab or view it online. Thank you.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.category = 'REPORT_READY'
);

-- 2. Seed Lab Order Confirmed template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Lab Order Confirmed', 'LABORATORY', 
       'Dear {patientName}, your diagnostic lab order {orderNumber} has been confirmed at {labName}. Your specimens are currently being processed.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.name = 'Lab Order Confirmed'
);

-- 3. Seed Payment Received Confirmation template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Payment Received Confirmation', 'PAYMENT', 
       'Dear {patientName}, payment of NPR {amount} for Invoice #{invoiceNumber} has been received by {labName}. Thank you for your payment.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.category = 'PAYMENT'
);

-- 4. Seed Appointment Confirmation template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Appointment Confirmation', 'APPOINTMENT', 
       'Dear {patientName}, your lab appointment at {labName} is confirmed for {appointmentDate} at {appointmentTime}. Your MRN is {mrn}. Thank you.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.name = 'Appointment Confirmation'
);

-- 5. Seed Appointment Reminder template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Appointment Reminder', 'APPOINTMENT', 
       'Dear {patientName}, this is a reminder for your upcoming diagnostic appointment at {labName} on {appointmentDate} at {appointmentTime}.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.name = 'Appointment Reminder'
);

-- 6. Seed Patient Registration Welcome template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Patient Registration Welcome', 'REGISTRATION', 
       'Dear {patientName}, welcome to {labName}. Your registration is complete. Your Patient ID (MRN) is {mrn}. Please keep this ID for test bookings and report collection.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.category = 'REGISTRATION'
);


-- Link and enable standard automation rules for all organizations

-- A. PATIENT_REGISTERED
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'PATIENT_REGISTERED', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.category = 'REGISTRATION' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- B. REPORT_READY
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'REPORT_READY', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.category = 'REPORT_READY' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- C. LAB_ORDER_CONFIRMED
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'LAB_ORDER_CONFIRMED', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.name = 'Lab Order Confirmed' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- D. PAYMENT_COMPLETED
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'PAYMENT_COMPLETED', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.category = 'PAYMENT' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- E. APPOINTMENT_BOOKED
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'APPOINTMENT_BOOKED', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.name = 'Appointment Confirmation' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- F. APPOINTMENT_REMINDER (24-hour advance reminder)
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, reminder_offset_hours, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'APPOINTMENT_REMINDER', TRUE, MIN(st.id), 24, 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.name = 'Appointment Reminder' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    reminder_offset_hours = COALESCE(sms_automation_rule.reminder_offset_hours, 24),
    updated_at = NOW();
