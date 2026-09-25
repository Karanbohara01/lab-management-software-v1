-- Reflex testing rules: "if source_test_id's result comes back at trigger level, suggest
-- target_test_id" — suggestion-only (see np.com.lims.catalog.entity.ReflexRule javadoc), never
-- auto-orders or auto-bills. Org-scoped like the rest of the test catalog.

CREATE TABLE reflex_rule (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id  BIGINT       NOT NULL,
    source_test_id   BIGINT       NOT NULL,
    trigger_type     VARCHAR(16)  NOT NULL,
    target_test_id   BIGINT       NOT NULL,
    note             VARCHAR(500) NULL,
    active           TINYINT(1)   NOT NULL DEFAULT 1,
    version          BIGINT       NOT NULL DEFAULT 0,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6)  NOT NULL,
    created_by       VARCHAR(100) NULL,
    updated_by       VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reflex_rule_source_test FOREIGN KEY (source_test_id) REFERENCES lab_test (id),
    CONSTRAINT fk_reflex_rule_target_test FOREIGN KEY (target_test_id) REFERENCES lab_test (id),
    INDEX ix_reflex_rule_source (organization_id, source_test_id, active)
) ENGINE = InnoDB;
