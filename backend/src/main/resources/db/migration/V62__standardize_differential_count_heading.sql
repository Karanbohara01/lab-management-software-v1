-- Pure rename for consistency: the pre-existing group heading "Differential count" (set well
-- before this feature, on V48's seed data and whatever clinics inherited it) now reads
-- inconsistently next to the fuller "Differential Leukocyte Count" phrasing V60/V61 just
-- backfilled everywhere else. Same grouping behaviour either way — this only changes the label
-- text shown on the printed report, standardising it platform-wide to match the newer phrasing
-- (DefaultParameterPresets.java / analytePresets.ts / the master catalogue already use it).

UPDATE parameter_master SET group_heading = 'Differential Leukocyte Count', updated_at = UTC_TIMESTAMP(6)
WHERE group_heading = 'Differential count';

UPDATE test_parameter SET group_heading = 'Differential Leukocyte Count', updated_at = UTC_TIMESTAMP(6)
WHERE group_heading = 'Differential count';

UPDATE master_test_parameter SET group_heading = 'Differential Leukocyte Count', updated_at = UTC_TIMESTAMP(6)
WHERE group_heading = 'Differential count';
