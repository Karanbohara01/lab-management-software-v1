-- ---------------------------------------------------------------------------
-- V71  Appointment test selection: which tests a booked visit is expected to
--      need, so the front desk can show a live, indicative estimate at booking
--      and pre-fill the order on conversion. Supersedes V70's "no test
--      selection at booking time yet".
--
--      Deliberately NO price/amount columns. lab_order_item is the first place
--      a price is ever snapshotted in this schema; an appointment sits upstream
--      of that line and must never become a second source of financial truth.
--      Every figure shown for an appointment is computed live from the catalog
--      through the same stateless preview the order builder uses, and only
--      becomes durable once the appointment converts into a LabOrder.
--
--      No organization_id either: like lab_order_item (see V33), a child table
--      with no standalone cross-parent queries inherits tenant isolation from
--      its parent's Hibernate filter.
-- ---------------------------------------------------------------------------

CREATE TABLE appointment_test (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    appointment_id  BIGINT       NOT NULL,
    lab_test_id     BIGINT       NOT NULL,
    quantity        INT          NOT NULL DEFAULT 1,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    created_by      VARCHAR(100) NULL,
    updated_by      VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_appointment_test_appointment FOREIGN KEY (appointment_id) REFERENCES appointment (id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_test_test FOREIGN KEY (lab_test_id) REFERENCES lab_test (id),
    CONSTRAINT ck_appointment_test_qty CHECK (quantity >= 1),
    INDEX ix_appointment_test_appointment (appointment_id)
) ENGINE = InnoDB;
