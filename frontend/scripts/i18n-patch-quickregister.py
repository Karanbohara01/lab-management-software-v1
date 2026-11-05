import pathlib

p = pathlib.Path('src/features/patients/QuickRegisterPatientModal.tsx')
s = p.read_text(encoding='utf-8')


def rep(old, new):
    global s
    assert old in s, f"MISSING: {old[:90]!r}"
    s = s.replace(old, new, 1)


rep(
    "import { patientsApi } from './api';\nimport { GENDERS } from './constants';",
    "import { patientsApi } from './api';\nimport { GENDERS, tOpts } from './constants';\nimport { useT } from '@/i18n';",
)

rep(
    "}) {\n  const [fullName, setFullName] = useState('');",
    "}) {\n  const t = useT();\n  const [fullName, setFullName] = useState('');",
)

rep(
    "    if (!fullName.trim()) {\n      setFormError('Enter a name.');\n      return;\n    }\n"
    "    if (!age.trim()) {\n      setFormError('Enter an approximate age.');\n      return;\n    }",
    "    if (!fullName.trim()) {\n      setFormError(t('Enter a name.'));\n      return;\n    }\n"
    "    if (!age.trim()) {\n      setFormError(t('Enter an approximate age.'));\n      return;\n    }",
)
rep(
    "      setFormError(err instanceof ApiError ? err.message : 'Unable to register the patient');",
    "      setFormError(err instanceof ApiError ? err.message : t('Unable to register the patient'));",
)

rep(
    '      title="Quick-register patient"\n'
    '      description="Just enough to identify them and carry on — add the rest later from their record."\n'
    "      footer={\n"
    "        <>\n"
    '          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>\n'
    "            Cancel\n"
    "          </Button>\n"
    "          <Button onClick={submit} loading={submitting}>\n"
    "            Register &amp; select\n"
    "          </Button>\n"
    "        </>\n"
    "      }",
    "      title={t('Quick-register patient')}\n"
    "      description={t('Just enough to identify them and carry on — add the rest later from their record.')}\n"
    "      footer={\n"
    "        <>\n"
    '          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>\n'
    "            {t('Cancel')}\n"
    "          </Button>\n"
    "          <Button onClick={submit} loading={submitting}>\n"
    "            {t('Register & select')}\n"
    "          </Button>\n"
    "        </>\n"
    "      }",
)

rep(
    '        <Input label="Full name" autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} />',
    "        <Input label={t('Full name')} autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} />",
)
rep(
    '            label="Gender"\n'
    "            options={GENDERS}",
    "            label={t('Gender')}\n"
    "            options={tOpts(GENDERS)}",
)
rep(
    '            label="Age (years)"',
    "            label={t('Age (years)')}",
)
rep(
    '        <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />',
    "        <Input label={t('Phone (optional)')} value={phone} onChange={(e) => setPhone(e.target.value)} />",
)
rep(
    "        <p className=\"text-xs text-muted\">\n"
    "          Need to capture address, ID documents, or billing/payer details now instead?{' '}\n"
    '          <Link to="/app/patients/new" className="text-primary hover:underline">\n'
    "            Use the full registration page\n"
    "          </Link>\n"
    "          .\n"
    "        </p>",
    "        <p className=\"text-xs text-muted\">\n"
    "          {t('Need to capture address, ID documents, or billing/payer details now instead?')}{' '}\n"
    '          <Link to="/app/patients/new" className="text-primary hover:underline">\n'
    "            {t('Use the full registration page')}\n"
    "          </Link>\n"
    "          .\n"
    "        </p>",
)

p.write_text(s, encoding='utf-8')
print('QuickRegisterPatientModal.tsx patched')
