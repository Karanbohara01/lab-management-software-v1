-- Links a DOCTOR-role login to the specific Doctor (referring-physician) record it represents,
-- so the doctor dashboard can be scoped to that doctor's own referrals only (see
-- CurrentUser.doctorId() / AppUserDetails / LabOrderService.search / ReportService.search).
-- Previously a DOCTOR-role account had no such link and could see every patient's orders/reports.

ALTER TABLE app_user
    ADD COLUMN doctor_id BIGINT NULL AFTER home_branch_id,
    ADD CONSTRAINT fk_app_user_doctor FOREIGN KEY (doctor_id) REFERENCES doctor (id);
