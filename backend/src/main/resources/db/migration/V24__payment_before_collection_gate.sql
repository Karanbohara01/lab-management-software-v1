-- ---------------------------------------------------------------------------
-- V24  Optional operational gate: require payment before a self-pay sample
--      can be collected. Off by default so existing labs are unaffected;
--      insurance/corporate/SSF-billed patients are always exempt (billed on
--      account), and a documented reason always allows an override.
-- ---------------------------------------------------------------------------

ALTER TABLE laboratory_profile
    ADD COLUMN require_payment_before_collection TINYINT(1) NOT NULL DEFAULT 0;
