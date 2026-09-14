-- V51 declared token_hash as CHAR(64); the entity's plain @Column(length = 64) maps to VARCHAR(64)
-- by default, and Hibernate's schema validation treats CHAR/VARCHAR as different types even at the
-- same length — startup failed with a SchemaManagementException. Fix the column type rather than
-- editing the already-applied V51.

ALTER TABLE password_reset_token MODIFY COLUMN token_hash VARCHAR(64) NOT NULL;
