-- A generated Report is an immutable snapshot (report_parameter), separate from the live
-- test_parameter definition — group_heading was captured on test_parameter and already flowed
-- through to the result-entry screen, but was never carried into this snapshot, so no printed
-- report could ever show sub-section headings (e.g. "Differential Leukocyte Count" grouping
-- Neutrophils/Lymphocytes/Monocytes/Eosinophils/Basophils within CBC) even for clinics that had
-- already set it on their own test's parameters. This adds the missing column; ReportService now
-- captures np.com.lims.catalog.entity.TestParameter.groupHeading into it at generation time.

ALTER TABLE report_parameter
    ADD COLUMN group_heading VARCHAR(120) NULL AFTER comment;
