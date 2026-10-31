import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { patientsApi } from './api';
import { GENDERS } from './constants';
import type { Gender, PatientDetail } from './types';

/**
 * A deliberately short registration form for when a flow elsewhere (booking an appointment,
 * building an order) hits "no patient found" and shouldn't have to throw away everything the
 * user already filled in just to go register one. Only fullName/gender are actually required by
 * the API — everything this form skips (address, ID documents, payer, consent, the live
 * duplicate-match check) stays on the full /app/patients/new page, which is still the right place
 * for a thorough registration; this is the fast path, not a replacement for it.
 */
export function QuickRegisterPatientModal({
  open,
  onClose,
  initialName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-fills the name field from whatever was already typed into the patient search box. */
  initialName?: string;
  onCreated: (patient: PatientDetail) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFullName(initialName?.trim() ?? '');
    setGender('MALE');
    setAge('');
    setPhone('');
    setFormError(null);
  }, [open, initialName]);

  const submit = async () => {
    if (!fullName.trim()) {
      setFormError('Enter a name.');
      return;
    }
    if (!age.trim()) {
      setFormError('Enter an approximate age.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await patientsApi.create({
        fullName: fullName.trim(),
        gender,
        approximateAgeYears: Number(age),
        phone: phone.trim() || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to register the patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick-register patient"
      description="Just enough to identify them and carry on — add the rest later from their record."
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Register &amp; select
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <Input label="Full name" autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Gender"
            options={GENDERS}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          />
          <Input
            label="Age (years)"
            type="number"
            min={0}
            max={150}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <p className="text-xs text-muted">
          Need to capture address, ID documents, or billing/payer details now instead?{' '}
          <Link to="/app/patients/new" className="text-primary hover:underline">
            Use the full registration page
          </Link>
          .
        </p>
      </div>
    </Modal>
  );
}
