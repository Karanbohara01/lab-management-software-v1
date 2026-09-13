-- Sequence numbers (MRN, order/invoice/report/accession/PO numbers) were a single global counter
-- shared by every organization — a new clinic's first patient got a number continuing the
-- 'primary' org's own sequence instead of starting fresh at 1. SequenceService now namespaces
-- every sequence name by organization id (see np.com.lims.common.sequence.SequenceService); this
-- migration renames the existing rows to match, so the 'primary' organization's counters
-- continue exactly where they were (no duplicate/colliding numbers for its real data) while every
-- other organization gets its own fresh row lazily created starting at 1 the first time it's used.

UPDATE app_sequence, (SELECT id FROM organization WHERE slug = 'primary') o
SET app_sequence.name = CONCAT(o.id, ':', app_sequence.name)
WHERE app_sequence.name NOT LIKE '%:%:%';
