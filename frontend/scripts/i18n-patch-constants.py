import pathlib

p = pathlib.Path('src/features/patients/constants.ts')
s = p.read_text(encoding='utf-8')

old_import = """import type {
  BloodGroup,
  Gender,
  IdentifierType,
  MaritalStatus,
  PatientCategory,
  PayerType,
  ReferralSourceType,
  RegistrationChannel,
} from './types';"""
new_import = old_import + "\nimport { translate, getLocale } from '@/i18n';"
assert old_import in s
s = s.replace(old_import, new_import, 1)

# A translating view of an options array, for building a <Select>'s options prop. The underlying
# constant stays in English — it is also the dictionary key the read-only `*Label` helpers below
# look up — this only translates the copy that is about to be rendered.
helper = """
type Opt<T extends string> = { value: T; label: string };

/** The options a <Select> renders, with each label passed through the current language. */
export function tOpts<T extends string>(opts: Opt<T>[]): Opt<T>[] {
  const locale = getLocale();
  return opts.map((o) => ({ ...o, label: translate(locale, o.label) }));
}
"""
old_type_line = "type Opt<T extends string> = { value: T; label: string };\n"
assert old_type_line in s
s = s.replace(old_type_line, helper.lstrip('\n'), 1)

old_label_fn = """const label = <T extends string>(opts: Opt<T>[]) => (v: T | null | undefined) =>
  (v && opts.find((o) => o.value === v)?.label) || '—';"""
new_label_fn = """/**
 * A read-only lookup — a table cell, a detail view — rather than a Select's options, so the
 * dictionary is consulted at the point the English source would otherwise be shown directly.
 */
const label = <T extends string>(opts: Opt<T>[]) => (v: T | null | undefined) => {
  const found = v && opts.find((o) => o.value === v)?.label;
  return found ? translate(getLocale(), found) : '—';
};"""
assert old_label_fn in s
s = s.replace(old_label_fn, new_label_fn, 1)

p.write_text(s, encoding='utf-8')
print('constants.ts patched')
