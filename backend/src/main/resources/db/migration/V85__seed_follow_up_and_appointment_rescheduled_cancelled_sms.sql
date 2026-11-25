-- V85: Seed default SMS templates and enable automation rules for Follow Up Due, Appointment Rescheduled, and Appointment Cancelled

-- 1. Seed Follow Up Due template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Follow Up Due', 'FOLLOW_UP', 
       'Dear {patientName}, this is a reminder from {labName} that your follow-up check is due on {dueDate}. Reason: {reason}. Please contact us if you need assistance.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.category = 'FOLLOW_UP'
);

-- 2. Seed Appointment Rescheduled template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Appointment Rescheduled', 'APPOINTMENT', 
       'Dear {patientName}, your lab appointment at {labName} has been rescheduled to {appointmentDate} at {appointmentTime}. Your MRN is {mrn}. Thank you.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.name = 'Appointment Rescheduled'
);

-- 3. Seed Appointment Cancelled template
INSERT INTO sms_template (organization_id, name, category, body, active, version, created_at, updated_at, created_by, updated_by)
SELECT o.id, 'Appointment Cancelled', 'APPOINTMENT', 
       'Dear {patientName}, your lab appointment scheduled for {appointmentDate} at {appointmentTime} at {labName} has been cancelled. Please contact us if you wish to reschedule.',
       TRUE, 0, NOW(), NOW(), 'system', 'system'
FROM organization o
WHERE NOT EXISTS (
    SELECT 1 FROM sms_template st 
    WHERE st.organization_id = o.id AND st.name = 'Appointment Cancelled'
);

-- Link and enable automation rules for all organizations

-- A. FOLLOW_UP_DUE
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'FOLLOW_UP_DUE', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.category = 'FOLLOW_UP' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- B. APPOINTMENT_RESCHEDULED
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'APPOINTMENT_RESCHEDULED', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.name = 'Appointment Rescheduled' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();

-- C. APPOINTMENT_CANCELLED
INSERT INTO sms_automation_rule (organization_id, event_type, enabled, template_id, version, created_at, updated_at, created_by, updated_by)
SELECT st.organization_id, 'APPOINTMENT_CANCELLED', TRUE, MIN(st.id), 0, NOW(), NOW(), 'system', 'system'
FROM sms_template st
WHERE st.name = 'Appointment Cancelled' AND st.active = TRUE
GROUP BY st.organization_id
ON DUPLICATE KEY UPDATE 
    enabled = TRUE,
    template_id = COALESCE(sms_automation_rule.template_id, VALUES(template_id)),
    updated_at = NOW();
