-- ---------------------------------------------------------------------------
-- V23  Microbiology: culture & sensitivity.
--      A lab_test can now be entered in CULTURE mode instead of the default
--      PARAMETRIC (parameter-per-row) mode. A culture result records an
--      overall growth outcome and, when organisms are isolated, one
--      culture_isolate per organism with an antibiotic susceptibility panel.
-- ---------------------------------------------------------------------------

ALTER TABLE lab_test
    ADD COLUMN result_mode VARCHAR(16) NOT NULL DEFAULT 'PARAMETRIC' AFTER test_type;

ALTER TABLE test_result
    ADD COLUMN result_mode    VARCHAR(16) NOT NULL DEFAULT 'PARAMETRIC' AFTER department_name,
    ADD COLUMN culture_growth VARCHAR(24) NULL AFTER comment;

-- backfill snapshot for results already created from culture-mode tests
UPDATE test_result tr
    JOIN lab_test lt ON lt.id = tr.lab_test_id
    SET tr.result_mode = lt.result_mode
    WHERE lt.result_mode <> 'PARAMETRIC';

CREATE TABLE antibiotic (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    code       VARCHAR(16)  NOT NULL,
    name       VARCHAR(120) NOT NULL,
    drug_class VARCHAR(60)  NULL,
    active     TINYINT(1)   NOT NULL DEFAULT 1,
    version    BIGINT       NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6)  NOT NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_antibiotic_code UNIQUE (code)
) ENGINE = InnoDB;

CREATE TABLE culture_isolate (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    test_result_id BIGINT       NOT NULL,
    sequence_no    INT          NOT NULL DEFAULT 1,
    organism_name  VARCHAR(160) NOT NULL,
    colony_count   VARCHAR(60)  NULL,
    significance   VARCHAR(24)  NOT NULL DEFAULT 'PATHOGEN',
    note           VARCHAR(500) NULL,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    created_by     VARCHAR(100) NULL,
    updated_by     VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_culture_isolate_result FOREIGN KEY (test_result_id) REFERENCES test_result (id),
    INDEX ix_culture_isolate_result (test_result_id)
) ENGINE = InnoDB;

CREATE TABLE culture_susceptibility (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    culture_isolate_id BIGINT      NOT NULL,
    antibiotic_id     BIGINT       NULL,
    antibiotic_name   VARCHAR(120) NOT NULL,
    sequence_no       INT          NOT NULL DEFAULT 1,
    interpretation    VARCHAR(8)   NOT NULL DEFAULT 'NT',
    mic_value         VARCHAR(24)  NULL,
    zone_mm           VARCHAR(24)  NULL,
    method            VARCHAR(24)  NULL,
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,
    created_by        VARCHAR(100) NULL,
    updated_by        VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_culture_susc_isolate    FOREIGN KEY (culture_isolate_id) REFERENCES culture_isolate (id),
    CONSTRAINT fk_culture_susc_antibiotic FOREIGN KEY (antibiotic_id)      REFERENCES antibiotic (id),
    INDEX ix_culture_susc_isolate (culture_isolate_id)
) ENGINE = InnoDB;

INSERT INTO antibiotic (code, name, drug_class, active, created_at, updated_at) VALUES
    ('AMP', 'Ampicillin',                    'Penicillin',       1, NOW(6), NOW(6)),
    ('AMC', 'Amoxicillin-Clavulanate',       'Beta-lactam/BLI',  1, NOW(6), NOW(6)),
    ('TZP', 'Piperacillin-Tazobactam',       'Beta-lactam/BLI',  1, NOW(6), NOW(6)),
    ('OXA', 'Oxacillin',                     'Penicillin',       1, NOW(6), NOW(6)),
    ('PEN', 'Penicillin G',                  'Penicillin',       1, NOW(6), NOW(6)),
    ('CFZ', 'Cefazolin',                     'Cephalosporin 1',  1, NOW(6), NOW(6)),
    ('CXM', 'Cefuroxime',                    'Cephalosporin 2',  1, NOW(6), NOW(6)),
    ('FOX', 'Cefoxitin',                     'Cephamycin',       1, NOW(6), NOW(6)),
    ('CTX', 'Cefotaxime',                    'Cephalosporin 3',  1, NOW(6), NOW(6)),
    ('CRO', 'Ceftriaxone',                   'Cephalosporin 3',  1, NOW(6), NOW(6)),
    ('CAZ', 'Ceftazidime',                   'Cephalosporin 3',  1, NOW(6), NOW(6)),
    ('FEP', 'Cefepime',                      'Cephalosporin 4',  1, NOW(6), NOW(6)),
    ('CFM', 'Cefixime',                      'Cephalosporin 3',  1, NOW(6), NOW(6)),
    ('IPM', 'Imipenem',                      'Carbapenem',       1, NOW(6), NOW(6)),
    ('MEM', 'Meropenem',                     'Carbapenem',       1, NOW(6), NOW(6)),
    ('ETP', 'Ertapenem',                     'Carbapenem',       1, NOW(6), NOW(6)),
    ('ATM', 'Aztreonam',                     'Monobactam',       1, NOW(6), NOW(6)),
    ('GEN', 'Gentamicin',                    'Aminoglycoside',   1, NOW(6), NOW(6)),
    ('AMK', 'Amikacin',                      'Aminoglycoside',   1, NOW(6), NOW(6)),
    ('TOB', 'Tobramycin',                    'Aminoglycoside',   1, NOW(6), NOW(6)),
    ('CIP', 'Ciprofloxacin',                 'Fluoroquinolone',  1, NOW(6), NOW(6)),
    ('LVX', 'Levofloxacin',                  'Fluoroquinolone',  1, NOW(6), NOW(6)),
    ('NOR', 'Norfloxacin',                   'Fluoroquinolone',  1, NOW(6), NOW(6)),
    ('OFX', 'Ofloxacin',                     'Fluoroquinolone',  1, NOW(6), NOW(6)),
    ('SXT', 'Trimethoprim-Sulfamethoxazole', 'Folate inhibitor', 1, NOW(6), NOW(6)),
    ('NIT', 'Nitrofurantoin',                'Nitrofuran',       1, NOW(6), NOW(6)),
    ('FOS', 'Fosfomycin',                    'Phosphonic acid',  1, NOW(6), NOW(6)),
    ('DOX', 'Doxycycline',                   'Tetracycline',     1, NOW(6), NOW(6)),
    ('TCY', 'Tetracycline',                  'Tetracycline',     1, NOW(6), NOW(6)),
    ('MIN', 'Minocycline',                   'Tetracycline',     1, NOW(6), NOW(6)),
    ('TGC', 'Tigecycline',                   'Glycylcycline',    1, NOW(6), NOW(6)),
    ('AZM', 'Azithromycin',                  'Macrolide',        1, NOW(6), NOW(6)),
    ('ERY', 'Erythromycin',                  'Macrolide',        1, NOW(6), NOW(6)),
    ('CLI', 'Clindamycin',                   'Lincosamide',      1, NOW(6), NOW(6)),
    ('VAN', 'Vancomycin',                    'Glycopeptide',     1, NOW(6), NOW(6)),
    ('TEC', 'Teicoplanin',                   'Glycopeptide',     1, NOW(6), NOW(6)),
    ('LNZ', 'Linezolid',                     'Oxazolidinone',    1, NOW(6), NOW(6)),
    ('CST', 'Colistin',                      'Polymyxin',        1, NOW(6), NOW(6)),
    ('CHL', 'Chloramphenicol',               'Phenicol',         1, NOW(6), NOW(6)),
    ('RIF', 'Rifampicin',                    'Ansamycin',        1, NOW(6), NOW(6));
