import pathlib

p = pathlib.Path('src/features/patients/RegisterPatientPage.tsx')
s = p.read_text(encoding='utf-8')
missing = []


def rep(old, new, required=True):
    global s
    if old not in s:
        missing.append(old[:100])
        return
    s = s.replace(old, new, 1)


# ---- imports: add the translation hooks + tOpts, keep SALUTATIONS untranslated by convention ----
rep(
    "import {\n"
    "  BLOOD_GROUPS,\n"
    "  GENDERS,\n"
    "  IDENTIFIER_TYPES,\n"
    "  LANGUAGES,\n"
    "  MARITAL_STATUSES,\n"
    "  PATIENT_CATEGORIES,\n"
    "  PAYER_TYPES,\n"
    "  REFERRAL_SOURCE_TYPES,\n"
    "  REGISTRATION_CHANNELS,\n"
    "  RELATIONSHIPS,\n"
    "  SALUTATIONS,\n"
    "} from './constants';",
    "import {\n"
    "  BLOOD_GROUPS,\n"
    "  GENDERS,\n"
    "  IDENTIFIER_TYPES,\n"
    "  LANGUAGES,\n"
    "  MARITAL_STATUSES,\n"
    "  PATIENT_CATEGORIES,\n"
    "  PAYER_TYPES,\n"
    "  REFERRAL_SOURCE_TYPES,\n"
    "  REGISTRATION_CHANNELS,\n"
    "  RELATIONSHIPS,\n"
    "  SALUTATIONS,\n"
    "  tOpts,\n"
    "} from './constants';\n"
    "import { useT } from '@/i18n';",
)

# ---- SectionCard: its own title/description are always passed already-translated by the caller,
# nothing to change here ----

# ---- component body: wire up t() right after the other hooks ----
rep(
    "export function RegisterPatientPage() {\n  const { id } = useParams<{ id: string }>();",
    "export function RegisterPatientPage() {\n  const t = useT();\n  const { id } = useParams<{ id: string }>();",
)

# ---- the Province/District/Municipality/Ward renderer ----
rep(
    '          label="Province"\n'
    "          options={[{ value: '', label: '—' }, ...PROVINCE_NAMES.map((p) => ({ value: p, label: p }))]}",
    "          label={t('Province')}\n"
    "          options={[{ value: '', label: '—' }, ...PROVINCE_NAMES.map((p) => ({ value: p, label: p }))]}",
)
rep(
    '          label="District"\n'
    "          disabled={!prov}\n"
    "          options={[{ value: '', label: '—' }, ...districtsOf(prov).map((d) => ({ value: d, label: d }))]}",
    "          label={t('District')}\n"
    "          disabled={!prov}\n"
    "          options={[{ value: '', label: '—' }, ...districtsOf(prov).map((d) => ({ value: d, label: d }))]}",
)
rep(
    '            label="Municipality / Rural municipality"\n'
    "            disabled={!dist}\n"
    "            value={list.includes(muni) ? muni : ''}\n"
    "            options={[\n"
    "              { value: '', label: '—' },\n"
    "              ...list.map((m) => ({ value: m, label: m })),\n"
    "              { value: '__other__', label: 'Other / not listed…' },\n"
    "            ]}",
    "            label={t('Municipality / Rural municipality')}\n"
    "            disabled={!dist}\n"
    "            value={list.includes(muni) ? muni : ''}\n"
    "            options={[\n"
    "              { value: '', label: '—' },\n"
    "              ...list.map((m) => ({ value: m, label: m })),\n"
    "              { value: '__other__', label: t('Other / not listed…') },\n"
    "            ]}",
)
rep(
    '            label="Municipality / Rural municipality"\n'
    "            placeholder={dist ? 'Type the local level name' : 'Select district first'}",
    "            label={t('Municipality / Rural municipality')}\n"
    "            placeholder={dist ? t('Type the local level name') : t('Select district first')}",
)
rep(
    "                  Choose from list instead\n"
    "                </button>",
    "                  {t('Choose from list instead')}\n"
    "                </button>",
)
rep(
    '          label="Ward no."\n'
    "          disabled={!dist}\n"
    "          options={[{ value: '', label: '—' }, ...WARD_OPTIONS.map((wd) => ({ value: wd, label: wd }))]}",
    "          label={t('Ward no.')}\n"
    "          disabled={!dist}\n"
    "          options={[{ value: '', label: '—' }, ...WARD_OPTIONS.map((wd) => ({ value: wd, label: wd }))]}",
)
rep(
    '        <Input label="Tole / street" {...register(`${prefix}.tole` as \'address.tole\')} />\n'
    '        <Input label="House / address line" {...register(`${prefix}.line` as \'address.line\')} />',
    "        <Input label={t('Tole / street')} {...register(`${prefix}.tole` as 'address.tole')} />\n"
    "        <Input label={t('House / address line')} {...register(`${prefix}.line` as 'address.line')} />",
)

# ---- messages set from inside the component (closure over t, unlike the module-level zod schema) ----
rep(
    "      setError('duplicateOverrideReason', {\n"
    "        message: 'This looks like an existing patient. Give a reason to register a new record, or open the existing one.',\n"
    "      });",
    "      setError('duplicateOverrideReason', {\n"
    "        message: t('This looks like an existing patient. Give a reason to register a new record, or open the existing one.'),\n"
    "      });",
)
rep(
    "      toast.success(isEdit ? 'Patient updated' : `Patient registered · ${saved.mrn}`);",
    "      toast.success(isEdit ? t('Patient updated') : t('Patient registered · {mrn}', { mrn: saved.mrn }));",
)
rep(
    "        setError('root', { message: 'Unable to save patient' });",
    "        setError('root', { message: t('Unable to save patient') });",
)

# ---- loading state ----
rep(
    "  if (isEdit && existing.loading && !existing.data) return <LoadingState label=\"Loading patient…\" />;",
    "  if (isEdit && existing.loading && !existing.data) return <LoadingState label={t('Loading patient…')} />;",
)

# ---- PageHeader ----
rep(
    "        title={isEdit ? `Edit patient · ${existing.data?.mrn ?? ''}` : 'Register patient'}\n"
    "        description={\n"
    "          isEdit\n"
    "            ? 'Update demographics, contact, referral and consent.'\n"
    "            : 'Search first — check the possible-duplicate panel before creating a new record.'\n"
    "        }\n"
    "        actions={\n"
    "          !isEdit ? (\n"
    "            <Checkbox\n"
    '              label="Quick register"\n'
    '              hint="Name, contact & category only"',
    "        title={isEdit ? t('Edit patient · {mrn}', { mrn: existing.data?.mrn ?? '' }) : t('Register patient')}\n"
    "        description={\n"
    "          isEdit\n"
    "            ? t('Update demographics, contact, referral and consent.')\n"
    "            : t('Search first — check the possible-duplicate panel before creating a new record.')\n"
    "        }\n"
    "        actions={\n"
    "          !isEdit ? (\n"
    "            <Checkbox\n"
    "              label={t('Quick register')}\n"
    "              hint={t('Name, contact & category only')}",
)

# ---- Identity section ----
rep(
    '        <SectionCard title="Identity">\n'
    '          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">\n'
    '            <Select label="Title" options={[{ value: \'\', label: \'—\' }, ...SALUTATIONS.map((s) => ({ value: s, label: s }))]} {...register(\'salutation\')} />\n'
    '            <Input label="Full name" placeholder="e.g. Anil Kumar Sharma" error={errors.fullName?.message} {...register(\'fullName\')} />\n'
    "          </div>\n"
    '          <div className="grid gap-4 sm:grid-cols-2">\n'
    '            <Input label="Name in Devanagari (optional)" {...register(\'nameLocal\')} />\n'
    '            <Select label="Gender" options={GENDERS} error={errors.gender?.message} {...register(\'gender\')} />\n'
    "          </div>\n"
    '          <div className="grid gap-4 sm:grid-cols-3">\n'
    '            <Input label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register(\'dateOfBirth\')} />\n'
    '            <Input label="Approx. age (yrs)" type="number" min={0} hint="If DOB unknown" error={errors.approximateAgeYears?.message} {...register(\'approximateAgeYears\')} />\n'
    '            <Select label="Blood group" options={BLOOD_GROUPS} {...register(\'bloodGroup\')} />\n'
    "          </div>\n"
    "        </SectionCard>",
    "        <SectionCard title={t('Identity')}>\n"
    '          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">\n'
    "            <Select label={t('Title')} options={[{ value: '', label: '—' }, ...SALUTATIONS.map((s) => ({ value: s, label: s }))]} {...register('salutation')} />\n"
    "            <Input label={t('Full name')} placeholder={t('e.g. Anil Kumar Sharma')} error={errors.fullName?.message} {...register('fullName')} />\n"
    "          </div>\n"
    '          <div className="grid gap-4 sm:grid-cols-2">\n'
    "            <Input label={t('Name in Devanagari (optional)')} {...register('nameLocal')} />\n"
    "            <Select label={t('Gender')} options={tOpts(GENDERS)} error={errors.gender?.message} {...register('gender')} />\n"
    "          </div>\n"
    '          <div className="grid gap-4 sm:grid-cols-3">\n'
    "            <Input label={t('Date of birth')} type=\"date\" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />\n"
    "            <Input label={t('Approx. age (yrs)')} type=\"number\" min={0} hint={t('If DOB unknown')} error={errors.approximateAgeYears?.message} {...register('approximateAgeYears')} />\n"
    "            <Select label={t('Blood group')} options={tOpts(BLOOD_GROUPS)} {...register('bloodGroup')} />\n"
    "          </div>\n"
    "        </SectionCard>",
)

# ---- Contact section ----
rep(
    '        <SectionCard title="Contact">\n'
    '          <div className="grid gap-4 sm:grid-cols-3">\n'
    '            <Input label="Phone" inputMode="tel" placeholder="98XXXXXXXX" error={errors.phone?.message} {...register(\'phone\')} />\n'
    '            <Input label="Alternate phone" inputMode="tel" {...register(\'alternatePhone\')} />\n'
    '            <Input label="Email" type="email" error={errors.email?.message} {...register(\'email\')} />\n'
    "          </div>\n"
    "        </SectionCard>",
    "        <SectionCard title={t('Contact')}>\n"
    '          <div className="grid gap-4 sm:grid-cols-3">\n'
    "            <Input label={t('Phone')} inputMode=\"tel\" placeholder=\"98XXXXXXXX\" error={errors.phone?.message} {...register('phone')} />\n"
    "            <Input label={t('Alternate phone')} inputMode=\"tel\" {...register('alternatePhone')} />\n"
    "            <Input label={t('Email')} type=\"email\" error={errors.email?.message} {...register('email')} />\n"
    "          </div>\n"
    "        </SectionCard>",
)

# ---- Permanent / current address ----
rep(
    '            <SectionCard title="Permanent address">\n'
    "              {renderAddress('address')}\n"
    '              <Checkbox label="Current address is the same as permanent" {...register(\'currentSameAsPermanent\')} />\n'
    "            </SectionCard>\n"
    "\n"
    "            {!w.currentSameAsPermanent && (\n"
    '              <SectionCard title="Current address">{renderAddress(\'currentAddress\')}</SectionCard>\n'
    "            )}",
    "            <SectionCard title={t('Permanent address')}>\n"
    "              {renderAddress('address')}\n"
    "              <Checkbox label={t('Current address is the same as permanent')} {...register('currentSameAsPermanent')} />\n"
    "            </SectionCard>\n"
    "\n"
    "            {!w.currentSameAsPermanent && (\n"
    "              <SectionCard title={t('Current address')}>{renderAddress('currentAddress')}</SectionCard>\n"
    "            )}",
)

# ---- Emergency contact ----
rep(
    "            <SectionCard\n"
    '              title="Emergency contact / guardian"\n'
    "              description={isMinor ? 'This patient is a minor — a guardian contact is strongly recommended.' : undefined}\n"
    "            >\n"
    '              <div className="grid gap-4 sm:grid-cols-3">\n'
    '                <Input label="Contact name" {...register(\'emergencyName\')} />\n'
    '                <Select label="Relationship" options={[{ value: \'\', label: \'—\' }, ...RELATIONSHIPS.map((r) => ({ value: r, label: r }))]} {...register(\'emergencyRelationship\')} />\n'
    '                <Input label="Contact phone" inputMode="tel" {...register(\'emergencyPhone\')} />\n'
    "              </div>\n"
    '              <Checkbox label="This contact is the legal guardian" {...register(\'emergencyGuardian\')} />\n'
    "            </SectionCard>",
    "            <SectionCard\n"
    "              title={t('Emergency contact / guardian')}\n"
    "              description={isMinor ? t('This patient is a minor — a guardian contact is strongly recommended.') : undefined}\n"
    "            >\n"
    '              <div className="grid gap-4 sm:grid-cols-3">\n'
    "                <Input label={t('Contact name')} {...register('emergencyName')} />\n"
    "                <Select label={t('Relationship')} options={[{ value: '', label: '—' }, ...RELATIONSHIPS.map((r) => ({ value: r, label: t(r) }))]} {...register('emergencyRelationship')} />\n"
    "                <Input label={t('Contact phone')} inputMode=\"tel\" {...register('emergencyPhone')} />\n"
    "              </div>\n"
    "              <Checkbox label={t('This contact is the legal guardian')} {...register('emergencyGuardian')} />\n"
    "            </SectionCard>",
)

# ---- Additional demographics ----
rep(
    '            <SectionCard title="Additional demographics">\n'
    '              <div className="grid gap-4 sm:grid-cols-2">\n'
    '                <Select label="Marital status" options={MARITAL_STATUSES} {...register(\'maritalStatus\')} />\n'
    '                <Input label="Occupation" {...register(\'occupation\')} />\n'
    '                <Input label="Nationality" {...register(\'nationality\')} />\n'
    '                <Select label="Preferred language" options={LANGUAGES.map((l) => ({ value: l, label: l }))} {...register(\'preferredLanguage\')} />\n'
    "              </div>\n"
    "            </SectionCard>",
    "            <SectionCard title={t('Additional demographics')}>\n"
    '              <div className="grid gap-4 sm:grid-cols-2">\n'
    "                <Select label={t('Marital status')} options={tOpts(MARITAL_STATUSES)} {...register('maritalStatus')} />\n"
    "                <Input label={t('Occupation')} {...register('occupation')} />\n"
    "                <Input label={t('Nationality')} {...register('nationality')} />\n"
    "                <Select label={t('Preferred language')} options={LANGUAGES.map((l) => ({ value: l, label: t(l) }))} {...register('preferredLanguage')} />\n"
    "              </div>\n"
    "            </SectionCard>",
)

# ---- Registration & referral ----
rep(
    '            <SectionCard title="Registration & referral">\n'
    '              <div className="grid gap-4 sm:grid-cols-2">\n'
    '                <Select label="Patient category" options={PATIENT_CATEGORIES} {...register(\'category\')} />\n'
    '                <Select label="Registration channel" options={REGISTRATION_CHANNELS} {...register(\'registrationChannel\')} />\n'
    '                <Input label="Branch / counter" {...register(\'registrationBranch\')} />\n'
    '                <Input label="External / hospital MRN" {...register(\'externalMrn\')} />\n'
    '                <Select label="Referral source" options={REFERRAL_SOURCE_TYPES} {...register(\'referralSourceType\')} />\n'
    "                {referralType === 'DOCTOR' ? (\n"
    "                  <Controller\n"
    "                    control={control}\n"
    '                    name="referringDoctorId"\n'
    "                    render={({ field }) => (\n"
    "                      <Combobox\n"
    '                        label="Referring doctor"\n'
    '                        placeholder="Search doctors…"\n'
    "                        options={doctorOptions}\n"
    "                        disabled={doctors.loading}\n"
    "                        value={field.value ?? ''}\n"
    "                        onChange={field.onChange}\n"
    "                      />\n"
    "                    )}\n"
    "                  />\n"
    "                ) : referralType !== 'SELF' ? (\n"
    '                  <Input label="Referral source name" placeholder="Hospital / camp / organisation" {...register(\'referralSourceName\')} />\n'
    "                ) : (\n"
    "                  <div />\n"
    "                )}\n"
    "              </div>\n"
    "            </SectionCard>",
    "            <SectionCard title={t('Registration & referral')}>\n"
    '              <div className="grid gap-4 sm:grid-cols-2">\n'
    "                <Select label={t('Patient category')} options={tOpts(PATIENT_CATEGORIES)} {...register('category')} />\n"
    "                <Select label={t('Registration channel')} options={tOpts(REGISTRATION_CHANNELS)} {...register('registrationChannel')} />\n"
    "                <Input label={t('Branch / counter')} {...register('registrationBranch')} />\n"
    "                <Input label={t('External / hospital MRN')} {...register('externalMrn')} />\n"
    "                <Select label={t('Referral source')} options={tOpts(REFERRAL_SOURCE_TYPES)} {...register('referralSourceType')} />\n"
    "                {referralType === 'DOCTOR' ? (\n"
    "                  <Controller\n"
    "                    control={control}\n"
    '                    name="referringDoctorId"\n'
    "                    render={({ field }) => (\n"
    "                      <Combobox\n"
    "                        label={t('Referring doctor')}\n"
    "                        placeholder={t('Search doctors…')}\n"
    "                        options={doctorOptions}\n"
    "                        disabled={doctors.loading}\n"
    "                        value={field.value ?? ''}\n"
    "                        onChange={field.onChange}\n"
    "                      />\n"
    "                    )}\n"
    "                  />\n"
    "                ) : referralType !== 'SELF' ? (\n"
    "                  <Input label={t('Referral source name')} placeholder={t('Hospital / camp / organisation')} {...register('referralSourceName')} />\n"
    "                ) : (\n"
    "                  <div />\n"
    "                )}\n"
    "              </div>\n"
    "            </SectionCard>",
)

# ---- Identity documents ----
rep(
    "            <SectionCard\n"
    '              title="Identity documents"\n'
    '              description="Citizenship, national ID, passport, PAN, insurance — used for lookup and billing."\n'
    "            >\n"
    "              {idFields.fields.length === 0 && (\n"
    '                <p className="text-sm text-muted">No documents recorded.</p>\n'
    "              )}\n"
    "              {idFields.fields.map((f, i) => (\n"
    '                <div key={f.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[10rem_1fr_1fr_auto]">\n'
    "                  <Select\n"
    '                    label="Type"\n'
    "                    options={IDENTIFIER_TYPES}\n"
    "                    {...register(`identifiers.${i}.type` as const)}\n"
    "                  />\n"
    '                  <Input label="Number" {...register(`identifiers.${i}.value` as const)} />\n'
    '                  <Input label="Issued at / date" placeholder="Place" {...register(`identifiers.${i}.issuedPlace` as const)} />\n'
    '                  <div className="flex items-end gap-3 pb-1">\n'
    '                    <Checkbox label="Primary" {...register(`identifiers.${i}.primary` as const)} />\n'
    "                    <button\n"
    '                      type="button"\n'
    "                      onClick={() => idFields.remove(i)}\n"
    '                      className="rounded-md p-2 text-muted hover:bg-surface-muted hover:text-danger"\n'
    '                      aria-label="Remove document"\n'
    "                    >\n"
    '                      <Trash2 className="h-4 w-4" aria-hidden />\n'
    "                    </button>\n"
    "                  </div>\n"
    "                </div>\n"
    "              ))}\n"
    "              <Button\n"
    '                type="button"\n'
    '                variant="secondary"\n'
    '                size="md"\n'
    "                onClick={() => idFields.append({ type: 'CITIZENSHIP', value: '', issuedPlace: '', issuedDate: '', primary: idFields.fields.length === 0 })}\n"
    "              >\n"
    '                <Plus className="h-4 w-4" aria-hidden />\n'
    "                Add document\n"
    "              </Button>\n"
    "            </SectionCard>",
    "            <SectionCard\n"
    "              title={t('Identity documents')}\n"
    "              description={t('Citizenship, national ID, passport, PAN, insurance — used for lookup and billing.')}\n"
    "            >\n"
    "              {idFields.fields.length === 0 && (\n"
    '                <p className="text-sm text-muted">{t(\'No documents recorded.\')}</p>\n'
    "              )}\n"
    "              {idFields.fields.map((f, i) => (\n"
    '                <div key={f.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[10rem_1fr_1fr_auto]">\n'
    "                  <Select\n"
    "                    label={t('Type')}\n"
    "                    options={tOpts(IDENTIFIER_TYPES)}\n"
    "                    {...register(`identifiers.${i}.type` as const)}\n"
    "                  />\n"
    "                  <Input label={t('Number')} {...register(`identifiers.${i}.value` as const)} />\n"
    "                  <Input label={t('Issued at / date')} placeholder={t('Place')} {...register(`identifiers.${i}.issuedPlace` as const)} />\n"
    '                  <div className="flex items-end gap-3 pb-1">\n'
    "                    <Checkbox label={t('Primary')} {...register(`identifiers.${i}.primary` as const)} />\n"
    "                    <button\n"
    '                      type="button"\n'
    "                      onClick={() => idFields.remove(i)}\n"
    '                      className="rounded-md p-2 text-muted hover:bg-surface-muted hover:text-danger"\n'
    "                      aria-label={t('Remove document')}\n"
    "                    >\n"
    '                      <Trash2 className="h-4 w-4" aria-hidden />\n'
    "                    </button>\n"
    "                  </div>\n"
    "                </div>\n"
    "              ))}\n"
    "              <Button\n"
    '                type="button"\n'
    '                variant="secondary"\n'
    '                size="md"\n'
    "                onClick={() => idFields.append({ type: 'CITIZENSHIP', value: '', issuedPlace: '', issuedDate: '', primary: idFields.fields.length === 0 })}\n"
    "              >\n"
    '                <Plus className="h-4 w-4" aria-hidden />\n'
    "                {t('Add document')}\n"
    "              </Button>\n"
    "            </SectionCard>",
)

# ---- Billing party ----
rep(
    '            <SectionCard title="Billing party" description="Who settles this patient\'s bills.">\n'
    '              <Select label="Payer" options={PAYER_TYPES} {...register(\'payerType\')} />\n'
    "              {w.payerType !== 'SELF' && (\n"
    '                <div className="grid gap-4 sm:grid-cols-2">\n'
    '                  <Input label="Payer name" placeholder="Company / insurer / scheme" {...register(\'payerName\')} />\n'
    '                  <Input label="Scheme / plan" {...register(\'payerScheme\')} />\n'
    '                  <Input label="Policy / member ID" {...register(\'payerMemberId\')} />\n'
    '                  <Input label="Authorization / claim ref" {...register(\'payerAuthorization\')} />\n'
    '                  <Input label="Coverage valid until" type="date" {...register(\'payerValidUntil\')} />\n'
    '                  <Input label="Note" {...register(\'payerNote\')} />\n'
    "                </div>\n"
    "              )}\n"
    "            </SectionCard>",
    "            <SectionCard title={t('Billing party')} description={t(\"Who settles this patient's bills.\")}>\n"
    "              <Select label={t('Payer')} options={tOpts(PAYER_TYPES)} {...register('payerType')} />\n"
    "              {w.payerType !== 'SELF' && (\n"
    '                <div className="grid gap-4 sm:grid-cols-2">\n'
    "                  <Input label={t('Payer name')} placeholder={t('Company / insurer / scheme')} {...register('payerName')} />\n"
    "                  <Input label={t('Scheme / plan')} {...register('payerScheme')} />\n"
    "                  <Input label={t('Policy / member ID')} {...register('payerMemberId')} />\n"
    "                  <Input label={t('Authorization / claim ref')} {...register('payerAuthorization')} />\n"
    "                  <Input label={t('Coverage valid until')} type=\"date\" {...register('payerValidUntil')} />\n"
    "                  <Input label={t('Note')} {...register('payerNote')} />\n"
    "                </div>\n"
    "              )}\n"
    "            </SectionCard>",
)

# ---- Flags ----
rep(
    '            <SectionCard title="Flags">\n'
    '              <div className="grid gap-3 sm:grid-cols-2">\n'
    '                <Checkbox label="VIP" hint="Prioritised handling" {...register(\'vip\')} />\n'
    "                {canConfidential && (\n"
    '                  <Checkbox label="Confidential" hint="Restrict who can view this record" {...register(\'confidential\')} />\n'
    "                )}\n"
    '                <Checkbox label="Test / training record" {...register(\'testRecord\')} />\n'
    '                <Checkbox label="Deceased" {...register(\'deceased\')} />\n'
    "              </div>\n"
    "              {w.deceased && (\n"
    '                <Input label="Date of death" type="date" className="max-w-xs" {...register(\'deceasedDate\')} />\n'
    "              )}\n"
    "            </SectionCard>",
    "            <SectionCard title={t('Flags')}>\n"
    '              <div className="grid gap-3 sm:grid-cols-2">\n'
    "                <Checkbox label={t('VIP')} hint={t('Prioritised handling')} {...register('vip')} />\n"
    "                {canConfidential && (\n"
    "                  <Checkbox label={t('Confidential')} hint={t('Restrict who can view this record')} {...register('confidential')} />\n"
    "                )}\n"
    "                <Checkbox label={t('Test / training record')} {...register('testRecord')} />\n"
    "                <Checkbox label={t('Deceased')} {...register('deceased')} />\n"
    "              </div>\n"
    "              {w.deceased && (\n"
    "                <Input label={t('Date of death')} type=\"date\" className=\"max-w-xs\" {...register('deceasedDate')} />\n"
    "              )}\n"
    "            </SectionCard>",
)

# ---- Consent ----
rep(
    '            <SectionCard title="Consent" description="Recorded with the staff member and time of capture.">\n'
    '              <Checkbox label="Consent to store and process personal and health data" {...register(\'consentStore\')} />\n'
    '              <Checkbox label="Consent to receive reports by SMS / email / messaging app" {...register(\'consentShareReports\')} />\n'
    '              <Checkbox label="Consent to use anonymised data for quality and research" {...register(\'consentResearch\')} />\n'
    "            </SectionCard>\n"
    "\n"
    '            <SectionCard title="Notes">\n'
    '              <Textarea label="Internal notes" rows={3} error={errors.notes?.message} {...register(\'notes\')} />\n'
    "            </SectionCard>",
    "            <SectionCard title={t('Consent')} description={t('Recorded with the staff member and time of capture.')}>\n"
    "              <Checkbox label={t('Consent to store and process personal and health data')} {...register('consentStore')} />\n"
    "              <Checkbox label={t('Consent to receive reports by SMS / email / messaging app')} {...register('consentShareReports')} />\n"
    "              <Checkbox label={t('Consent to use anonymised data for quality and research')} {...register('consentResearch')} />\n"
    "            </SectionCard>\n"
    "\n"
    "            <SectionCard title={t('Notes')}>\n"
    "              <Textarea label={t('Internal notes')} rows={3} error={errors.notes?.message} {...register('notes')} />\n"
    "            </SectionCard>",
)

# ---- Duplicate override ----
rep(
    '          <SectionCard title="Duplicate override">\n'
    '            <Alert tone="warning">\n'
    "              A very similar patient already exists. If this really is a different person, record why.\n"
    "            </Alert>\n"
    "            <Input\n"
    '              label="Reason for registering a new record"\n'
    "              error={errors.duplicateOverrideReason?.message}\n"
    "              {...register('duplicateOverrideReason')}\n"
    "            />\n"
    "          </SectionCard>",
    "          <SectionCard title={t('Duplicate override')}>\n"
    '            <Alert tone="warning">\n'
    "              {t('A very similar patient already exists. If this really is a different person, record why.')}\n"
    "            </Alert>\n"
    "            <Input\n"
    "              label={t('Reason for registering a new record')}\n"
    "              error={errors.duplicateOverrideReason?.message}\n"
    "              {...register('duplicateOverrideReason')}\n"
    "            />\n"
    "          </SectionCard>",
)

# ---- footer bar ----
rep(
    '            <Button variant="secondary" type="button" onClick={() => navigate(back.href)}>\n'
    "              Cancel\n"
    "            </Button>\n"
    '            <Button type="submit" loading={isSubmitting}>\n'
    "              {isEdit ? 'Save changes' : 'Register patient'}\n"
    "            </Button>",
    '            <Button variant="secondary" type="button" onClick={() => navigate(back.href)}>\n'
    "              {t('Cancel')}\n"
    "            </Button>\n"
    '            <Button type="submit" loading={isSubmitting}>\n'
    "              {isEdit ? t('Save changes') : t('Register patient')}\n"
    "            </Button>",
)

if missing:
    print('MISSING', len(missing), 'anchors:')
    for m in missing:
        print('  -', m)
else:
    p.write_text(s, encoding='utf-8')
    print('RegisterPatientPage.tsx fully patched, no misses')
