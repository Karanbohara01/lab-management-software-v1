import { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Modal, ModalCancelButton } from '@/components/ui/Modal';
import { useIsDirty } from '@/hooks/useUnsavedChanges';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/useAuth';
import { PatientPicker } from '@/features/patients/PatientPicker';
import type { PatientListItem } from '@/features/patients/types';
import { doctorsApi } from '@/features/doctors/api';
import type { Doctor } from '@/features/doctors/types';
import { branchesApi, type Branch } from '@/features/branches/api';
import { TestPicker } from '@/features/catalog/TestPicker';
import { appointmentsApi } from './api';
import { AppointmentEstimate } from './AppointmentEstimate';
import type { AppointmentDetail, AppointmentTestLine } from './types';
import { useT } from '@/i18n';

/** Local <-> ISO conversion for a native datetime-local input (no date library in this codebase). */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentFormModal({
  open,
  onClose,
  appointment,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** null = booking a new appointment; set = rescheduling this one (patient can't be changed). */
  appointment: AppointmentDetail | null;
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const { user } = useAuth();
  const isHq = !user?.homeBranchId;

  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  // Catalog references + quantity only — no price lives in this state, by design.
  const [tests, setTests] = useState<AppointmentTestLine[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    doctorsApi.list({ activeOnly: true, size: 200 }).then((res) => setDoctors(res.content));
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  /** What the form starts as — the prefill source and the yardstick for "has this been edited?". */
  const initial = useMemo(
    () =>
      appointment
        ? {
            patientId: appointment.patientId as number | null,
            doctorId: appointment.referringDoctorId ? String(appointment.referringDoctorId) : '',
            branchId: appointment.branchId ? String(appointment.branchId) : '',
            scheduledAt: toLocalInputValue(appointment.scheduledAt),
            reason: appointment.reason ?? '',
            tests: appointment.items,
          }
        : { patientId: null, doctorId: '', branchId: '', scheduledAt: '', reason: '', tests: [] },
    [appointment],
  );

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setPatient(
      appointment
        ? {
            id: appointment.patientId,
            mrn: appointment.patientMrn,
            salutation: null,
            fullName: appointment.patientName,
            gender: 'OTHER',
            ageYears: null,
            phone: null,
            category: 'WALK_IN',
            referringDoctorName: null,
            vip: false,
            confidential: false,
            deceased: false,
            active: true,
            dataCompleteness: 100,
            createdAt: appointment.scheduledAt,
          }
        : null,
    );
    setDoctorId(initial.doctorId);
    setBranchId(initial.branchId);
    setScheduledAt(initial.scheduledAt);
    setReason(initial.reason);
    setTests(initial.tests);
  }, [open, appointment, initial]);

  const isDirty = useIsDirty(
    { patientId: patient?.id ?? null, doctorId, branchId, scheduledAt, reason, tests },
    initial,
  );

  const submit = async () => {
    if (!patient) {
      setFormError(t('Pick a patient.'));
      return;
    }
    if (!scheduledAt) {
      setFormError(t('Pick a date and time.'));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      patientId: patient.id,
      referringDoctorId: doctorId ? Number(doctorId) : undefined,
      branchId: branchId ? Number(branchId) : undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      reason: reason.trim() || undefined,
      items: tests.map((t) => ({ testId: t.testId, quantity: t.quantity })),
    };
    try {
      if (appointment) {
        await appointmentsApi.update(appointment.id, payload);
        toast.success(t('Appointment rescheduled'));
      } else {
        await appointmentsApi.create(payload);
        toast.success(t('Appointment booked'));
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('Unable to save the appointment'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={appointment ? t('Reschedule appointment') : t('New appointment')}
      confirmClose={isDirty && !submitting}
      footer={
        <>
          <ModalCancelButton />
          <Button onClick={submit} loading={submitting}>
            {appointment ? t('Save changes') : t('Book appointment')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <div>
          <p className="mb-1 text-sm font-medium text-foreground">{t('Patient')}</p>
          {patient ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
              <div>
                <p className="font-medium text-foreground">
                  {patient.fullName} <span className="font-mono text-xs text-muted">{patient.mrn}</span>
                </p>
              </div>
              {!appointment && (
                <Button variant="ghost" size="sm" onClick={() => setPatient(null)}>
                  <X className="h-4 w-4" aria-hidden />
                  {t('Change')}
                </Button>
              )}
            </div>
          ) : (
            <PatientPicker onSelect={setPatient} />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('Tests (optional)')}</p>
            <p className="text-xs text-muted">
              {t('Choose what the visit is expected to need — an indicative total appears below.')}
            </p>
          </div>
          <TestPicker
            existingIds={tests.map((test) => test.testId)}
            onAdd={(test) =>
              setTests((prev) => [
                ...prev,
                { testId: test.id, testCode: test.code, testName: test.name, departmentName: test.departmentName, quantity: 1 },
              ])
            }
          />
          {tests.length > 0 && (
            <ul className="divide-y divide-border rounded-md border border-border">
              {tests.map((test, index) => (
                <li key={test.testId} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{test.testName}</span>
                    <span className="ml-1.5 font-mono text-xs text-muted">{test.testCode}</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={test.quantity}
                    onChange={(e) =>
                      setTests((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, quantity: Math.max(1, Number(e.target.value) || 1) } : row,
                        ),
                      )
                    }
                    className="h-8 w-16 rounded-md border border-input bg-surface px-2 text-center"
                    aria-label={t('Quantity for {name}', { name: test.testName })}
                  />
                  <button
                    type="button"
                    onClick={() => setTests((prev) => prev.filter((_, i) => i !== index))}
                    className="text-muted hover:text-danger"
                    aria-label={t('Remove {name}', { name: test.testName })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <AppointmentEstimate items={tests} />
        </div>

        <Combobox
          label={t('Referring doctor (optional)')}
          placeholder={t('Search doctors…')}
          value={doctorId}
          onChange={setDoctorId}
          options={doctors.map((d) => ({ value: String(d.id), label: d.fullName }))}
        />

        {isHq && (
          <Select
            label={t('Branch')}
            options={[{ value: '', label: t('Default for your account') }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          />
        )}

        <DateTimePicker
          label={t('Date & time')}
          value={scheduledAt}
          onChange={setScheduledAt}
          minDate={new Date(new Date().toDateString())}
        />

        <Textarea
          label={t('Reason (optional)')}
          placeholder={t('e.g. Annual CBC panel, follow-up lipid profile')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
