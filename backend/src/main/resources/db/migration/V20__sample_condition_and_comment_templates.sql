-- ---------------------------------------------------------------------------
-- V20  Specimen condition flags captured at receipt (haemolysed / lipaemic /
--      icteric / clotted / QNS / wrong container), a library of canned result
--      comments, and a per-parameter comment on the frozen report.
-- ---------------------------------------------------------------------------

ALTER TABLE sample
    ADD COLUMN haemolysed          TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN lipaemic            TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN icteric             TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN clotted             TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN insufficient_volume TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN wrong_container     TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN condition_note      VARCHAR(300) NULL;

ALTER TABLE report_parameter
    ADD COLUMN comment VARCHAR(300) NULL;

CREATE TABLE result_comment_template (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    scope          VARCHAR(16)  NOT NULL,
    department_id  BIGINT       NULL,
    lab_test_id    BIGINT       NULL,
    category       VARCHAR(60)  NULL,
    title          VARCHAR(120) NOT NULL,
    body           VARCHAR(1000) NOT NULL,
    display_order  INT          NOT NULL DEFAULT 0,
    active         TINYINT(1)   NOT NULL DEFAULT 1,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    created_by     VARCHAR(100) NULL,
    updated_by     VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_rct_department FOREIGN KEY (department_id) REFERENCES department (id),
    CONSTRAINT fk_rct_test       FOREIGN KEY (lab_test_id)   REFERENCES lab_test (id),
    INDEX ix_rct_scope (scope),
    INDEX ix_rct_department (department_id),
    INDEX ix_rct_test (lab_test_id)
) ENGINE = InnoDB;

INSERT INTO result_comment_template
    (scope, category, title, body, display_order, active, created_at, updated_at, created_by, updated_by)
VALUES
 ('GLOBAL', 'Specimen', 'Haemolysed sample',
  'Sample was haemolysed. Affected analytes (e.g. potassium, LDH, AST) may be falsely elevated; a repeat sample is advised.',
  1, 1, NOW(6), NOW(6), 'system', 'system'),
 ('GLOBAL', 'Specimen', 'Repeat sample requested',
  'Result to be interpreted with caution. A repeat specimen has been requested for confirmation.',
  2, 1, NOW(6), NOW(6), 'system', 'system'),
 ('GLOBAL', 'Clinical', 'Clinical correlation advised',
  'Findings should be correlated with the clinical picture and, where relevant, previous results.',
  3, 1, NOW(6), NOW(6), 'system', 'system');
