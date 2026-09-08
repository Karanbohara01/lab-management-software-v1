import { useState, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FilePlus2, GitMerge, Pencil, Printer, ShieldAlert, Star } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
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
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Lab orders' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'reports', label: 'Reports' },
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
        <span className="font-medium uppercase tracking-wide text-muted">Record completeness</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-surface-muted">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.PATIENT_WRITE);
  const canOrder = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);
  const canMerge = hasPermission(PERMISSIONS.PATIENT_MERGE);

  const [tab, setTab] = useState<Tab>('overview');
  const [mergeOpen, setMergeOpen] = useState(false);

  const { data: patient, loading, error, refetch } = useQuery(() => patientsApi.get(Number(id)), [id]);

  if (loading && !patient) return <LoadingState label="Loading patient…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!patient) return null;

  const merged = patient.mergedIntoId != null;

  const consent = patient.consent;
  const consentLine = [
    consent.store && 'Data processing',
    consent.shareReports && 'Report delivery',
    consent.research && 'Research use',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Link to="/app/patients" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to patients
      </Link>

      <PageHeader
        title={`${patient.salutation ? `${patient.salutation} ` : ''}${patient.fullName}`}
        description={`${patient.mrn} · ${formatGender(patient.gender)}${patient.ageYears != null ? ` · ${patient.ageYears}y` : ''} · ${categoryLabel(patient.category)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {patient.vip && (
              <Badge tone="warning">
                <Star className="h-3 w-3 fill-current" aria-hidden /> VIP
              </Badge>
            )}
            {patient.confidential && (
              <Badge tone="danger">
                <ShieldAlert className="h-3 w-3" aria-hidden /> Confidential
              </Badge>
            )}
            {patient.deceased && <Badge tone="neutral">Deceased</Badge>}
            {!patient.deceased && (
              <Badge tone={patient.active ? 'success' : 'neutral'}>{patient.active ? 'Active' : 'Inactive'}</Badge>
            )}
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden />
              Card
            </Button>
            {canOrder && !merged && (
              <Button variant="secondary" onClick={() => navigate(`/app/orders/new?patientId=${patient.id}`)}>
                <FilePlus2 className="h-4 w-4" aria-hidden />
                New order
              </Button>
            )}
            {canMerge && !merged && (
              <Button variant="secondary" onClick={() => setMergeOpen(true)}>
                <GitMerge className="h-4 w-4" aria-hidden />
                Merge
              </Button>
            )}
            {canWrite && !merged && (
              <Button variant="secondary" onClick={() => navigate(`/app/patients/${patient.id}/edit`)}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </Button>
            )}
          </div>
        }
      />

      {merged && (
        <div className="mb-4">
          <Alert tone="warning">
            This record was merged into{' '}
            <Link to={`/app/patients/${patient.mergedIntoId}`} className="font-semibold underline">
              {patient.mergedIntoMrn ?? `patient #${patient.mergedIntoId}`}
            </Link>
            {patient.mergedAt ? ` on ${formatDate(patient.mergedAt)}` : ''}
            {patient.mergedBy ? ` by ${patient.mergedBy}` : ''}. It is kept only as an MRN alias.
          </Alert>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary'
                : 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted hover:text-foreground'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Demographics" />
            <CardBody className="space-y-4">
              <CompletenessBar value={patient.dataCompleteness} />
              <dl className="grid grid-cols-2 gap-4">
                <Field label="MRN" value={<span className="font-mono">{patient.mrn}</span>} />
                <Field label="External MRN" value={patient.externalMrn} />
                <Field label="Gender" value={formatGender(patient.gender)} />
                <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
                <Field
                  label="Age"
                  value={
                    patient.ageYears != null
                      ? `${patient.ageYears} years${patient.minor ? ' (minor)' : ''}`
                      : patient.approximateAgeYears != null
                        ? `~${patient.approximateAgeYears} years`
                        : '—'
                  }
                />
                <Field label="Blood group" value={bloodGroupLabel(patient.bloodGroup)} />
                <Field label="Marital status" value={maritalStatusLabel(patient.maritalStatus)} />
                <Field label="Occupation" value={patient.occupation} />
                <Field label="Nationality" value={patient.nationality} />
                <Field label="Preferred language" value={patient.preferredLanguage} />
                {patient.deceased && <Field label="Date of death" value={formatDate(patient.deceasedDate)} />}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contact & address" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Phone" value={patient.phone} />
                <Field label="Alternate phone" value={patient.alternatePhone} />
                <Field label="Email" value={patient.email} />
                <div />
                <div className="col-span-2">
                  <Field label="Permanent address" value={formatAddress(patient.address)} />
                </div>
                {patient.currentAddress && (
                  <div className="col-span-2">
                    <Field label="Current address" value={formatAddress(patient.currentAddress)} />
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Emergency contact" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Name" value={patient.emergencyContact?.name} />
                <Field label="Relationship" value={patient.emergencyContact?.relationship} />
                <Field label="Phone" value={patient.emergencyContact?.phone} />
                <Field label="Legal guardian" value={patient.emergencyContact?.guardian ? 'Yes' : '—'} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Referral & registration" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Category" value={categoryLabel(patient.category)} />
                <Field label="Channel" value={channelLabel(patient.registrationChannel)} />
                <Field label="Referral source" value={referralSourceLabel(patient.referralSourceType)} />
                <Field
                  label="Referred by"
                  value={patient.referringDoctorName || patient.referralSourceName}
                />
                <Field label="Branch / counter" value={patient.registrationBranch} />
                <Field label="Registered" value={formatDate(patient.createdAt)} />
                <Field label="Registered by" value={patient.createdBy} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Identity documents" />
            <CardBody>
              {patient.identifiers.length === 0 ? (
                <p className="text-sm text-muted">None recorded.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {patient.identifiers.map((idn) => (
                    <li key={idn.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <span className="font-medium text-foreground">{identifierTypeLabel(idn.type)}</span>
                      <span className="font-mono text-muted">{idn.value}</span>
                      {idn.issuedPlace && <span className="text-muted">· {idn.issuedPlace}</span>}
                      {idn.primary && <Badge tone="info">Primary</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Billing party" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Payer" value={payerTypeLabel(patient.payer.type)} />
                {patient.payer.type !== 'SELF' && (
                  <>
                    <Field label="Payer name" value={patient.payer.name} />
                    <Field label="Scheme / plan" value={patient.payer.scheme} />
                    <Field label="Policy / member ID" value={patient.payer.memberId} />
                    <Field label="Authorization" value={patient.payer.authorization} />
                    <Field label="Valid until" value={formatDate(patient.payer.validUntil)} />
                    <Field label="Note" value={patient.payer.note} />
                  </>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Consent" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Given" value={consentLine || 'None recorded'} />
                <Field label="Captured" value={formatDateTime(patient.consentCapturedAt)} />
                <Field label="Captured by" value={patient.consentCapturedBy} />
              </dl>
            </CardBody>
          </Card>

          {patient.notes && (
            <Card>
              <CardHeader title="Notes" />
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
