import { useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FilePlus2, GitMerge, Link2, Pencil, Printer, ShieldAlert, Star } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useListParams } from '@/hooks/useListParams';
import { translate, getLocale, useT } from '@/i18n';
import { useBackTarget, useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { patientsApi } from './api';
import { Alert } from '@/components/ui/Alert';
import { PatientCard } from './PatientCard';
import { MergePatientModal } from './MergePatientModal';
import { PatientOrdersTab } from './PatientOrdersTab';
import { PatientReportsTab } from './PatientReportsTab';
import { PatientInvoicesTab } from './PatientInvoicesTab';
import { formatAddress, formatDate, formatDateTime, formatGender } from './format';
import {
  bloodGroupLabel,
  categoryLabel,
  channelLabel,
  identifierTypeLabel,
  maritalStatusLabel,
  payerTypeLabel,
  referralSourceLabel,
} from './constants';

type Tab = 'overview' | 'orders' | 'invoices' | 'reports';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview (tab)' },
  { id: 'orders', label: 'Lab orders (tab)' },
  { id: 'invoices', label: 'Invoices (tab)' },
  { id: 'reports', label: 'Reports (tab)' },
];

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || '—'}</dd>
    </div>
  );
}

function CompletenessBar({ value }: { value: number }) {
  const tone = value >= 80 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger';
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wide text-muted">{translate(getLocale(), 'Record completeness')}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-surface-muted">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** The open tab is in the URL, so it survives a refresh, a bookmark and the browser's Back button. */
const PARAMS = { tab: 'overview' };

export function PatientDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigateFrom();
  const { back } = useBackTarget();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canWrite = hasPermission(PERMISSIONS.PATIENT_WRITE);
  const canOrder = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);
  const canMerge = hasPermission(PERMISSIONS.PATIENT_MERGE);

  const { params, set } = useListParams(PARAMS);
  const tab = (TABS.some((tb) => tb.id === params.tab) ? params.tab : 'overview') as Tab;
  const tabs = TABS.map((tb) => ({ ...tb, label: t(tb.label) }));
  const [mergeOpen, setMergeOpen] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);

  const copyPortalLink = async () => {
    if (!id) return;
    setLinkBusy(true);
    try {
      const { url } = await patientsApi.portalLink(Number(id));
      await navigator.clipboard.writeText(url);
      toast.success(t('Portal link copied — share it with the patient'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to get portal link'));
    } finally {
      setLinkBusy(false);
    }
  };

  const { data: patient, loading, error, refetch } = useQuery(() => patientsApi.get(Number(id)), [id]);

  if (loading && !patient) return <LoadingState label={t('Loading patient…')} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!patient) return null;

  const merged = patient.mergedIntoId != null;

  const consent = patient.consent;
  const consentLine = [
    consent.store && t('Data processing'),
    consent.shareReports && t('Report delivery'),
    consent.research && t('Research use'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader
        back={back}
        title={`${patient.salutation ? `${patient.salutation} ` : ''}${patient.fullName}`}
        description={`${patient.mrn} · ${formatGender(patient.gender)}${patient.ageYears != null ? ` · ${patient.ageYears}y` : ''} · ${categoryLabel(patient.category)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {patient.vip && (
              <Badge tone="warning">
                <Star className="h-3 w-3 fill-current" aria-hidden /> {t('VIP')}
              </Badge>
            )}
            {patient.confidential && (
              <Badge tone="danger">
                <ShieldAlert className="h-3 w-3" aria-hidden /> {t('Confidential')}
              </Badge>
            )}
            {patient.deceased && <Badge tone="neutral">{t('Deceased')}</Badge>}
            {!patient.deceased && (
              <Badge tone={patient.active ? 'success' : 'neutral'}>{t(patient.active ? 'Active' : 'Inactive')}</Badge>
            )}
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden />
              {t('Patient card')}
            </Button>
            {!merged && (
              <Button variant="secondary" disabled={linkBusy} onClick={copyPortalLink}>
                <Link2 className="h-4 w-4" aria-hidden />
                {t('Portal link')}
              </Button>
            )}
            {canOrder && !merged && (
              <Button variant="secondary" onClick={() => navigate(`/app/orders/new?patientId=${patient.id}`)}>
                <FilePlus2 className="h-4 w-4" aria-hidden />
                {t('New order')}
              </Button>
            )}
            {canMerge && !merged && (
              <Button variant="secondary" onClick={() => setMergeOpen(true)}>
                <GitMerge className="h-4 w-4" aria-hidden />
                {t('Merge')}
              </Button>
            )}
            {canWrite && !merged && (
              <Button variant="secondary" onClick={() => navigate(`/app/patients/${patient.id}/edit`)}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t('Edit (action)')}
              </Button>
            )}
          </div>
        }
      />

      {merged && (
        <div className="mb-4">
          <Alert tone="warning">
            {t('This record was merged into')}{' '}
            <Link to={`/app/patients/${patient.mergedIntoId}`} className="font-semibold underline">
              {patient.mergedIntoMrn ?? t('patient #{id}', { id: patient.mergedIntoId ?? '' })}
            </Link>
            {patient.mergedAt ? ` ${t('on {date}', { date: formatDate(patient.mergedAt) })}` : ''}
            {patient.mergedBy ? ` ${t('by {name}', { name: patient.mergedBy })}` : ''}. {t('It is kept only as an MRN alias.')}
          </Alert>
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={(id) => set({ tab: id })} className="mb-4" />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={t('Demographics')} />
            <CardBody className="space-y-4">
              <CompletenessBar value={patient.dataCompleteness} />
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t('MRN')} value={<span className="font-mono">{patient.mrn}</span>} />
                <Field label={t('External MRN')} value={patient.externalMrn} />
                <Field label={t('Gender')} value={formatGender(patient.gender)} />
                <Field label={t('Date of birth')} value={formatDate(patient.dateOfBirth)} />
                <Field
                  label={t('Age')}
                  value={
                    patient.ageYears != null
                      ? t(patient.minor ? '{age} years (minor)' : '{age} years', { age: patient.ageYears })
                      : patient.approximateAgeYears != null
                        ? t('~{age} years', { age: patient.approximateAgeYears })
                        : '—'
                  }
                />
                <Field label={t('Blood group')} value={bloodGroupLabel(patient.bloodGroup)} />
                <Field label={t('Marital status')} value={maritalStatusLabel(patient.maritalStatus)} />
                <Field label={t('Occupation')} value={patient.occupation} />
                <Field label={t('Nationality')} value={patient.nationality} />
                <Field label={t('Preferred language')} value={patient.preferredLanguage} />
                {patient.deceased && <Field label={t('Date of death')} value={formatDate(patient.deceasedDate)} />}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Contact & address')} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t('Phone')} value={patient.phone} />
                <Field label={t('Alternate phone')} value={patient.alternatePhone} />
                <Field label={t('Email')} value={patient.email} />
                <div />
                <div className="col-span-2">
                  <Field label={t('Permanent address')} value={formatAddress(patient.address)} />
                </div>
                {patient.currentAddress && (
                  <div className="col-span-2">
                    <Field label={t('Current address')} value={formatAddress(patient.currentAddress)} />
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Emergency contact')} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t('Name')} value={patient.emergencyContact?.name} />
                <Field label={t('Relationship')} value={patient.emergencyContact?.relationship} />
                <Field label={t('Phone')} value={patient.emergencyContact?.phone} />
                <Field label={t('Legal guardian')} value={patient.emergencyContact?.guardian ? t('Yes') : '—'} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Referral & registration')} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t('Category')} value={categoryLabel(patient.category)} />
                <Field label={t('Channel')} value={channelLabel(patient.registrationChannel)} />
                <Field label={t('Referral source')} value={referralSourceLabel(patient.referralSourceType)} />
                <Field
                  label={t('Referred by')}
                  value={patient.referringDoctorName || patient.referralSourceName}
                />
                <Field label={t('Branch / counter')} value={patient.registrationBranch} />
                <Field label={t('Registered')} value={formatDate(patient.createdAt)} />
                <Field label={t('Registered by')} value={patient.createdBy} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Identity documents')} />
            <CardBody>
              {patient.identifiers.length === 0 ? (
                <p className="text-sm text-muted">{t('None recorded.')}</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {patient.identifiers.map((idn) => (
                    <li key={idn.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <span className="font-medium text-foreground">{identifierTypeLabel(idn.type)}</span>
                      <span className="font-mono text-muted">{idn.value}</span>
                      {idn.issuedPlace && <span className="text-muted">· {idn.issuedPlace}</span>}
                      {idn.primary && <Badge tone="info">{t('Primary')}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Billing party')} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t('Payer')} value={payerTypeLabel(patient.payer.type)} />
                {patient.payer.type !== 'SELF' && (
                  <>
                    <Field label={t('Payer name')} value={patient.payer.name} />
                    <Field label={t('Scheme / plan')} value={patient.payer.scheme} />
                    <Field label={t('Policy / member ID')} value={patient.payer.memberId} />
                    <Field label={t('Authorization')} value={patient.payer.authorization} />
                    <Field label={t('Valid until')} value={formatDate(patient.payer.validUntil)} />
                    <Field label={t('Note')} value={patient.payer.note} />
                  </>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Consent')} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label={t('Given')} value={consentLine || t('None recorded')} />
                <Field label={t('Captured')} value={formatDateTime(patient.consentCapturedAt)} />
                <Field label={t('Captured by')} value={patient.consentCapturedBy} />
              </dl>
            </CardBody>
          </Card>

          {patient.notes && (
            <Card>
              <CardHeader title={t('Notes')} />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-foreground">{patient.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === 'orders' && <PatientOrdersTab patientId={patient.id} />}
      {tab === 'reports' && <PatientReportsTab patientId={patient.id} />}
      {tab === 'invoices' && <PatientInvoicesTab patientId={patient.id} />}

      <PatientCard patient={patient} />

      <MergePatientModal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        survivor={patient}
        onMerged={() => {
          setMergeOpen(false);
          refetch();
        }}
      />
    </>
  );
}
