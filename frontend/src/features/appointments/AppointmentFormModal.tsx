import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
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
import { appointmentsApi } from './api';
import type { AppointmentDetail } from './types';

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
  const toast = useToast();
  const { user } = useAuth();
  const isHq = !user?.homeBranchId;

  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    doctorsApi.list({ activeOnly: true, size: 200 }).then((res) => setDoctors(res.content));
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (appointment) {
      setPatient({
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
      });
      setDoctorId(appointment.referringDoctorId ? String(appointment.referringDoctorId) : '');
      setBranchId(appointment.branchId ? String(appointment.branchId) : '');
      setScheduledAt(toLocalInputValue(appointment.scheduledAt));
      setReason(appointment.reason ?? '');
    } else {
      setPatient(null);
      setDoctorId('');
      setBranchId('');
      setScheduledAt('');
      setReason('');
    }
  }, [open, appointment]);

  const submit = async () => {
    if (!patient) {
      setFormError('Pick a patient.');
      return;
    }
    if (!scheduledAt) {
      setFormError('Pick a date and time.');
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
    };
    try {
      if (appointment) {
        await appointmentsApi.update(appointment.id, payload);
        toast.success('Appointment rescheduled');
      } else {
        await appointmentsApi.create(payload);
        toast.success('Appointment booked');
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to save the appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment ? 'Reschedule appointment' : 'New appointment'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            {appointment ? 'Save changes' : 'Book appointment'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <div>
          <p className="mb-1 text-sm font-medium text-foreground">Patient</p>
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
                  Change
                </Button>
              )}
            </div>
          ) : (
            <PatientPicker onSelect={setPatient} />
          )}
        </div>

        <Combobox
          label="Referring doctor (optional)"
          placeholder="Search doctors…"
          value={doctorId}
          onChange={setDoctorId}
          options={doctors.map((d) => ({ value: String(d.id), label: d.fullName }))}
        />

        {isHq && (
          <Select
            label="Branch"
            options={[{ value: '', label: 'Default for your account' }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          />
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="appointment-scheduled-at">
            Date &amp; time
          </label>
          <input
            id="appointment-scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Textarea
          label="Reason (optional)"
          placeholder="e.g. Annual CBC panel, follow-up lipid profile"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
