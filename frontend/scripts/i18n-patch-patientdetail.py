import pathlib

p = pathlib.Path('src/features/patients/PatientDetailPage.tsx')
s = p.read_text(encoding='utf-8')
missing = []


def rep(old, new):
    global s
    if old not in s:
        missing.append(old[:100])
        return
    s = s.replace(old, new, 1)


rep(
    "import {\n"
    "  bloodGroupLabel,\n"
    "  categoryLabel,\n"
    "  channelLabel,\n"
    "  identifierTypeLabel,\n"
    "  maritalStatusLabel,\n"
    "  payerTypeLabel,\n"
    "  referralSourceLabel,\n"
    "} from './constants';",
    "import {\n"
    "  bloodGroupLabel,\n"
    "  categoryLabel,\n"
    "  channelLabel,\n"
    "  identifierTypeLabel,\n"
    "  maritalStatusLabel,\n"
    "  payerTypeLabel,\n"
    "  referralSourceLabel,\n"
    "} from './constants';\n"
    "import { useT } from '@/i18n';",
)

# Field's own `label` is always passed already-translated by the caller below — nothing to touch
# in the Field/CompletenessBar helper components themselves, except the one literal they own.
rep(
    '        <span className="font-medium uppercase tracking-wide text-muted">Record completeness</span>',
    "        <span className=\"font-medium uppercase tracking-wide text-muted\">{translate(getLocale(), 'Record completeness')}</span>",
)
rep(
    "import { useListParams } from '@/hooks/useListParams';",
    "import { useListParams } from '@/hooks/useListParams';\nimport { translate, getLocale } from '@/i18n';",
)

rep(
    "export function PatientDetailPage() {\n  const { id } = useParams<{ id: string }>();\n  const navigate = useNavigateFrom();",
    "export function PatientDetailPage() {\n  const t = useT();\n  const { id } = useParams<{ id: string }>();\n  const navigate = useNavigateFrom();",
)

rep(
    "  const { params, set } = useListParams(PARAMS);\n"
    "  const tab = (TABS.some((t) => t.id === params.tab) ? params.tab : 'overview') as Tab;",
    "  const { params, set } = useListParams(PARAMS);\n"
    "  const tab = (TABS.some((tb) => tb.id === params.tab) ? params.tab : 'overview') as Tab;\n"
    "  const tabs = TABS.map((tb) => ({ ...tb, label: t(tb.label) }));",
)

rep(
    "      await navigator.clipboard.writeText(url);\n"
    "      toast.success('Portal link copied — share it with the patient');\n"
    "    } catch (err) {\n"
    "      toast.error(err instanceof ApiError ? err.message : 'Unable to get portal link');",
    "      await navigator.clipboard.writeText(url);\n"
    "      toast.success(t('Portal link copied — share it with the patient'));\n"
    "    } catch (err) {\n"
    "      toast.error(err instanceof ApiError ? err.message : t('Unable to get portal link'));",
)

rep(
    "  if (loading && !patient) return <LoadingState label=\"Loading patient…\" />;",
    "  if (loading && !patient) return <LoadingState label={t('Loading patient…')} />;",
)

rep(
    "  const consentLine = [\n"
    "    consent.store && 'Data processing',\n"
    "    consent.shareReports && 'Report delivery',\n"
    "    consent.research && 'Research use',\n"
    "  ]",
    "  const consentLine = [\n"
    "    consent.store && t('Data processing'),\n"
    "    consent.shareReports && t('Report delivery'),\n"
    "    consent.research && t('Research use'),\n"
    "  ]",
)

# ---- PageHeader action badges + buttons ----
rep(
    "            {patient.vip && (\n"
    '              <Badge tone="warning">\n'
    '                <Star className="h-3 w-3 fill-current" aria-hidden /> VIP\n'
    "              </Badge>\n"
    "            )}\n"
    "            {patient.confidential && (\n"
    '              <Badge tone="danger">\n'
    '                <ShieldAlert className="h-3 w-3" aria-hidden /> Confidential\n'
    "              </Badge>\n"
    "            )}\n"
    '            {patient.deceased && <Badge tone="neutral">Deceased</Badge>}\n'
    "            {!patient.deceased && (\n"
    "              <Badge tone={patient.active ? 'success' : 'neutral'}>{patient.active ? 'Active' : 'Inactive'}</Badge>\n"
    "            )}\n"
    '            <Button variant="secondary" onClick={() => window.print()}>\n'
    '              <Printer className="h-4 w-4" aria-hidden />\n'
    "              Card\n"
    "            </Button>\n"
    "            {!merged && (\n"
    '              <Button variant="secondary" disabled={linkBusy} onClick={copyPortalLink}>\n'
    '                <Link2 className="h-4 w-4" aria-hidden />\n'
    "                Portal link\n"
    "              </Button>\n"
    "            )}\n"
    "            {canOrder && !merged && (\n"
    "              <Button variant=\"secondary\" onClick={() => navigate(`/app/orders/new?patientId=${patient.id}`)}>\n"
    '                <FilePlus2 className="h-4 w-4" aria-hidden />\n'
    "                New order\n"
    "              </Button>\n"
    "            )}\n"
    "            {canMerge && !merged && (\n"
    '              <Button variant="secondary" onClick={() => setMergeOpen(true)}>\n'
    '                <GitMerge className="h-4 w-4" aria-hidden />\n'
    "                Merge\n"
    "              </Button>\n"
    "            )}\n"
    "            {canWrite && !merged && (\n"
    "              <Button variant=\"secondary\" onClick={() => navigate(`/app/patients/${patient.id}/edit`)}>\n"
    '                <Pencil className="h-4 w-4" aria-hidden />\n'
    "                Edit\n"
    "              </Button>\n"
    "            )}",
    "            {patient.vip && (\n"
    '              <Badge tone="warning">\n'
    '                <Star className="h-3 w-3 fill-current" aria-hidden /> {t(\'VIP\')}\n'
    "              </Badge>\n"
    "            )}\n"
    "            {patient.confidential && (\n"
    '              <Badge tone="danger">\n'
    '                <ShieldAlert className="h-3 w-3" aria-hidden /> {t(\'Confidential\')}\n'
    "              </Badge>\n"
    "            )}\n"
    "            {patient.deceased && <Badge tone=\"neutral\">{t('Deceased')}</Badge>}\n"
    "            {!patient.deceased && (\n"
    "              <Badge tone={patient.active ? 'success' : 'neutral'}>{t(patient.active ? 'Active' : 'Inactive')}</Badge>\n"
    "            )}\n"
    '            <Button variant="secondary" onClick={() => window.print()}>\n'
    '              <Printer className="h-4 w-4" aria-hidden />\n'
    "              {t('Patient card')}\n"
    "            </Button>\n"
    "            {!merged && (\n"
    '              <Button variant="secondary" disabled={linkBusy} onClick={copyPortalLink}>\n'
    '                <Link2 className="h-4 w-4" aria-hidden />\n'
    "                {t('Portal link')}\n"
    "              </Button>\n"
    "            )}\n"
    "            {canOrder && !merged && (\n"
    "              <Button variant=\"secondary\" onClick={() => navigate(`/app/orders/new?patientId=${patient.id}`)}>\n"
    '                <FilePlus2 className="h-4 w-4" aria-hidden />\n'
    "                {t('New order')}\n"
    "              </Button>\n"
    "            )}\n"
    "            {canMerge && !merged && (\n"
    '              <Button variant="secondary" onClick={() => setMergeOpen(true)}>\n'
    '                <GitMerge className="h-4 w-4" aria-hidden />\n'
    "                {t('Merge')}\n"
    "              </Button>\n"
    "            )}\n"
    "            {canWrite && !merged && (\n"
    "              <Button variant=\"secondary\" onClick={() => navigate(`/app/patients/${patient.id}/edit`)}>\n"
    '                <Pencil className="h-4 w-4" aria-hidden />\n'
    "                {t('Edit (action)')}\n"
    "              </Button>\n"
    "            )}",
)

rep(
    "        <div className=\"mb-4\">\n"
    '          <Alert tone="warning">\n'
    "            This record was merged into{' '}\n"
    "            <Link to={`/app/patients/${patient.mergedIntoId}`} className=\"font-semibold underline\">\n"
    "              {patient.mergedIntoMrn ?? `patient #${patient.mergedIntoId}`}\n"
    "            </Link>\n"
    "            {patient.mergedAt ? ` on ${formatDate(patient.mergedAt)}` : ''}\n"
    "            {patient.mergedBy ? ` by ${patient.mergedBy}` : ''}. It is kept only as an MRN alias.\n"
    "          </Alert>\n"
    "        </div>",
    "        <div className=\"mb-4\">\n"
    '          <Alert tone="warning">\n'
    "            {t('This record was merged into')}{' '}\n"
    "            <Link to={`/app/patients/${patient.mergedIntoId}`} className=\"font-semibold underline\">\n"
    "              {patient.mergedIntoMrn ?? t('patient #{id}', { id: patient.mergedIntoId })}\n"
    "            </Link>\n"
    "            {patient.mergedAt ? ` ${t('on {date}', { date: formatDate(patient.mergedAt) })}` : ''}\n"
    "            {patient.mergedBy ? ` ${t('by {name}', { name: patient.mergedBy })}` : ''}. {t('It is kept only as an MRN alias.')}\n"
    "          </Alert>\n"
    "        </div>",
)

rep(
    "      <Tabs tabs={TABS} value={tab} onChange={(id) => set({ tab: id })} className=\"mb-4\" />",
    "      <Tabs tabs={tabs} value={tab} onChange={(id) => set({ tab: id })} className=\"mb-4\" />",
)

# ---- Overview tab: card headers + Field labels ----
rep(
    '            <CardHeader title="Demographics" />\n'
    '            <CardBody className="space-y-4">\n'
    "              <CompletenessBar value={patient.dataCompleteness} />\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    '                <Field label="MRN" value={<span className="font-mono">{patient.mrn}</span>} />\n'
    '                <Field label="External MRN" value={patient.externalMrn} />\n'
    '                <Field label="Gender" value={formatGender(patient.gender)} />\n'
    '                <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />\n'
    "                <Field\n"
    '                  label="Age"\n'
    "                  value={\n"
    "                    patient.ageYears != null\n"
    "                      ? `${patient.ageYears} years${patient.minor ? ' (minor)' : ''}`\n"
    "                      : patient.approximateAgeYears != null\n"
    "                        ? `~${patient.approximateAgeYears} years`\n"
    "                        : '—'\n"
    "                  }\n"
    "                />\n"
    '                <Field label="Blood group" value={bloodGroupLabel(patient.bloodGroup)} />\n'
    '                <Field label="Marital status" value={maritalStatusLabel(patient.maritalStatus)} />\n'
    '                <Field label="Occupation" value={patient.occupation} />\n'
    '                <Field label="Nationality" value={patient.nationality} />\n'
    '                <Field label="Preferred language" value={patient.preferredLanguage} />\n'
    '                {patient.deceased && <Field label="Date of death" value={formatDate(patient.deceasedDate)} />}\n'
    "              </dl>",
    "            <CardHeader title={t('Demographics')} />\n"
    '            <CardBody className="space-y-4">\n'
    "              <CompletenessBar value={patient.dataCompleteness} />\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    "                <Field label={t('MRN')} value={<span className=\"font-mono\">{patient.mrn}</span>} />\n"
    "                <Field label={t('External MRN')} value={patient.externalMrn} />\n"
    "                <Field label={t('Gender')} value={formatGender(patient.gender)} />\n"
    "                <Field label={t('Date of birth')} value={formatDate(patient.dateOfBirth)} />\n"
    "                <Field\n"
    "                  label={t('Age')}\n"
    "                  value={\n"
    "                    patient.ageYears != null\n"
    "                      ? t(patient.minor ? '{age} years (minor)' : '{age} years', { age: patient.ageYears })\n"
    "                      : patient.approximateAgeYears != null\n"
    "                        ? t('~{age} years', { age: patient.approximateAgeYears })\n"
    "                        : '—'\n"
    "                  }\n"
    "                />\n"
    "                <Field label={t('Blood group')} value={bloodGroupLabel(patient.bloodGroup)} />\n"
    "                <Field label={t('Marital status')} value={maritalStatusLabel(patient.maritalStatus)} />\n"
    "                <Field label={t('Occupation')} value={patient.occupation} />\n"
    "                <Field label={t('Nationality')} value={patient.nationality} />\n"
    "                <Field label={t('Preferred language')} value={patient.preferredLanguage} />\n"
    "                {patient.deceased && <Field label={t('Date of death')} value={formatDate(patient.deceasedDate)} />}\n"
    "              </dl>",
)

rep(
    '            <CardHeader title="Contact & address" />\n'
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    '                <Field label="Phone" value={patient.phone} />\n'
    '                <Field label="Alternate phone" value={patient.alternatePhone} />\n'
    '                <Field label="Email" value={patient.email} />\n'
    "                <div />\n"
    '                <div className="col-span-2">\n'
    '                  <Field label="Permanent address" value={formatAddress(patient.address)} />\n'
    "                </div>\n"
    "                {patient.currentAddress && (\n"
    '                  <div className="col-span-2">\n'
    '                    <Field label="Current address" value={formatAddress(patient.currentAddress)} />\n'
    "                  </div>\n"
    "                )}\n"
    "              </dl>",
    "            <CardHeader title={t('Contact & address')} />\n"
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    "                <Field label={t('Phone')} value={patient.phone} />\n"
    "                <Field label={t('Alternate phone')} value={patient.alternatePhone} />\n"
    "                <Field label={t('Email')} value={patient.email} />\n"
    "                <div />\n"
    '                <div className="col-span-2">\n'
    "                  <Field label={t('Permanent address')} value={formatAddress(patient.address)} />\n"
    "                </div>\n"
    "                {patient.currentAddress && (\n"
    '                  <div className="col-span-2">\n'
    "                    <Field label={t('Current address')} value={formatAddress(patient.currentAddress)} />\n"
    "                  </div>\n"
    "                )}\n"
    "              </dl>",
)

rep(
    '            <CardHeader title="Emergency contact" />\n'
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    '                <Field label="Name" value={patient.emergencyContact?.name} />\n'
    '                <Field label="Relationship" value={patient.emergencyContact?.relationship} />\n'
    '                <Field label="Phone" value={patient.emergencyContact?.phone} />\n'
    '                <Field label="Legal guardian" value={patient.emergencyContact?.guardian ? \'Yes\' : \'—\'} />\n'
    "              </dl>",
    "            <CardHeader title={t('Emergency contact')} />\n"
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    "                <Field label={t('Name')} value={patient.emergencyContact?.name} />\n"
    "                <Field label={t('Relationship')} value={patient.emergencyContact?.relationship} />\n"
    "                <Field label={t('Phone')} value={patient.emergencyContact?.phone} />\n"
    "                <Field label={t('Legal guardian')} value={patient.emergencyContact?.guardian ? t('Yes') : '—'} />\n"
    "              </dl>",
)

rep(
    '            <CardHeader title="Referral & registration" />\n'
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    '                <Field label="Category" value={categoryLabel(patient.category)} />\n'
    '                <Field label="Channel" value={channelLabel(patient.registrationChannel)} />\n'
    '                <Field label="Referral source" value={referralSourceLabel(patient.referralSourceType)} />\n'
    "                <Field\n"
    '                  label="Referred by"\n'
    "                  value={patient.referringDoctorName || patient.referralSourceName}\n"
    "                />\n"
    '                <Field label="Branch / counter" value={patient.registrationBranch} />\n'
    '                <Field label="Registered" value={formatDate(patient.createdAt)} />\n'
    '                <Field label="Registered by" value={patient.createdBy} />\n'
    "              </dl>",
    "            <CardHeader title={t('Referral & registration')} />\n"
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    "                <Field label={t('Category')} value={categoryLabel(patient.category)} />\n"
    "                <Field label={t('Channel')} value={channelLabel(patient.registrationChannel)} />\n"
    "                <Field label={t('Referral source')} value={referralSourceLabel(patient.referralSourceType)} />\n"
    "                <Field\n"
    "                  label={t('Referred by')}\n"
    "                  value={patient.referringDoctorName || patient.referralSourceName}\n"
    "                />\n"
    "                <Field label={t('Branch / counter')} value={patient.registrationBranch} />\n"
    "                <Field label={t('Registered')} value={formatDate(patient.createdAt)} />\n"
    "                <Field label={t('Registered by')} value={patient.createdBy} />\n"
    "              </dl>",
)

rep(
    '            <CardHeader title="Identity documents" />\n'
    "            <CardBody>\n"
    "              {patient.identifiers.length === 0 ? (\n"
    '                <p className="text-sm text-muted">None recorded.</p>\n'
    "              ) : (\n"
    '                <ul className="divide-y divide-border text-sm">\n'
    "                  {patient.identifiers.map((idn) => (\n"
    '                    <li key={idn.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">\n'
    '                      <span className="font-medium text-foreground">{identifierTypeLabel(idn.type)}</span>\n'
    '                      <span className="font-mono text-muted">{idn.value}</span>\n'
    '                      {idn.issuedPlace && <span className="text-muted">· {idn.issuedPlace}</span>}\n'
    '                      {idn.primary && <Badge tone="info">Primary</Badge>}\n'
    "                    </li>\n"
    "                  ))}\n"
    "                </ul>\n"
    "              )}",
    "            <CardHeader title={t('Identity documents')} />\n"
    "            <CardBody>\n"
    "              {patient.identifiers.length === 0 ? (\n"
    "                <p className=\"text-sm text-muted\">{t('None recorded.')}</p>\n"
    "              ) : (\n"
    '                <ul className="divide-y divide-border text-sm">\n'
    "                  {patient.identifiers.map((idn) => (\n"
    '                    <li key={idn.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">\n'
    '                      <span className="font-medium text-foreground">{identifierTypeLabel(idn.type)}</span>\n'
    '                      <span className="font-mono text-muted">{idn.value}</span>\n'
    '                      {idn.issuedPlace && <span className="text-muted">· {idn.issuedPlace}</span>}\n'
    "                      {idn.primary && <Badge tone=\"info\">{t('Primary')}</Badge>}\n"
    "                    </li>\n"
    "                  ))}\n"
    "                </ul>\n"
    "              )}",
)

rep(
    '            <CardHeader title="Billing party" />\n'
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    '                <Field label="Payer" value={payerTypeLabel(patient.payer.type)} />\n'
    "                {patient.payer.type !== 'SELF' && (\n"
    "                  <>\n"
    '                    <Field label="Payer name" value={patient.payer.name} />\n'
    '                    <Field label="Scheme / plan" value={patient.payer.scheme} />\n'
    '                    <Field label="Policy / member ID" value={patient.payer.memberId} />\n'
    '                    <Field label="Authorization" value={patient.payer.authorization} />\n'
    '                    <Field label="Valid until" value={formatDate(patient.payer.validUntil)} />\n'
    '                    <Field label="Note" value={patient.payer.note} />\n'
    "                  </>\n"
    "                )}\n"
    "              </dl>",
    "            <CardHeader title={t('Billing party')} />\n"
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    "                <Field label={t('Payer')} value={payerTypeLabel(patient.payer.type)} />\n"
    "                {patient.payer.type !== 'SELF' && (\n"
    "                  <>\n"
    "                    <Field label={t('Payer name')} value={patient.payer.name} />\n"
    "                    <Field label={t('Scheme / plan')} value={patient.payer.scheme} />\n"
    "                    <Field label={t('Policy / member ID')} value={patient.payer.memberId} />\n"
    "                    <Field label={t('Authorization')} value={patient.payer.authorization} />\n"
    "                    <Field label={t('Valid until')} value={formatDate(patient.payer.validUntil)} />\n"
    "                    <Field label={t('Note')} value={patient.payer.note} />\n"
    "                  </>\n"
    "                )}\n"
    "              </dl>",
)

rep(
    '            <CardHeader title="Consent" />\n'
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    '                <Field label="Given" value={consentLine || \'None recorded\'} />\n'
    '                <Field label="Captured" value={formatDateTime(patient.consentCapturedAt)} />\n'
    '                <Field label="Captured by" value={patient.consentCapturedBy} />\n'
    "              </dl>",
    "            <CardHeader title={t('Consent')} />\n"
    "            <CardBody>\n"
    '              <dl className="grid grid-cols-2 gap-4">\n'
    "                <Field label={t('Given')} value={consentLine || t('None recorded')} />\n"
    "                <Field label={t('Captured')} value={formatDateTime(patient.consentCapturedAt)} />\n"
    "                <Field label={t('Captured by')} value={patient.consentCapturedBy} />\n"
    "              </dl>",
)

rep(
    "            <Card>\n"
    '              <CardHeader title="Notes" />\n'
    "              <CardBody>\n"
    '                <p className="whitespace-pre-wrap text-sm text-foreground">{patient.notes}</p>\n'
    "              </CardBody>\n"
    "            </Card>",
    "            <Card>\n"
    "              <CardHeader title={t('Notes')} />\n"
    "              <CardBody>\n"
    '                <p className="whitespace-pre-wrap text-sm text-foreground">{patient.notes}</p>\n'
    "              </CardBody>\n"
    "            </Card>",
)

if missing:
    print('MISSING', len(missing), 'anchors:')
    for m in missing:
        print('  -', m)
else:
    p.write_text(s, encoding='utf-8')
    print('PatientDetailPage.tsx fully patched, no misses')
