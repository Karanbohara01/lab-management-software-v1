import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { NepaliDateInput } from '@/components/ui/NepaliDateInput';
import { adToBs, bsToAd, calculateAgeFromDob, getDetailedAge, parseBsDate } from '@/lib/nepaliDate';
import { ApiError } from '@/types/api';
import { patientsApi } from './api';
import { GENDERS, tOpts } from './constants';
import { useT } from '@/i18n';
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
  const t = useT();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dobAd, setDobAd] = useState('');
  const [dobBs, setDobBs] = useState('');
  const [bsError, setBsError] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFullName(initialName?.trim() ?? '');
    setGender('MALE');
    setDobAd('');
    setDobBs('');
    setBsError(null);
    setAge('');
    setPhone('');
    setFormError(null);
  }, [open, initialName]);

  const handleAdChange = (adVal: string) => {
    setDobAd(adVal);
    if (!adVal) {
      setDobBs('');
      setBsError(null);
      return;
    }
    const bs = adToBs(adVal);
    if (bs) {
      setDobBs(bs.formatted);
      setBsError(null);
    } else {
      setDobBs('');
    }
    const calculatedAge = calculateAgeFromDob(adVal);
    if (calculatedAge != null) {
      setAge(String(calculatedAge));
    }
  };

  const handleBsChange = (bsVal: string) => {
    setDobBs(bsVal);
    if (!bsVal.trim()) {
      setDobAd('');
      setBsError(null);
      return;
    }
    const parsed = parseBsDate(bsVal);
    if (!parsed) {
      if (bsVal.length >= 10) {
        setBsError(t('Invalid B.S. date (YYYY-MM-DD)'));
      } else {
        setBsError(null);
      }
      return;
    }
    const ad = bsToAd(parsed.year, parsed.month, parsed.day);
    if (!ad) {
      setBsError(t('Invalid B.S. date'));
      return;
    }
    const todayAd = new Date().toISOString().split('T')[0] ?? '';
    if (ad.formatted > todayAd) {
      setBsError(t('Date of birth cannot be in the future'));
      return;
    }
    setBsError(null);
    setDobAd(ad.formatted);
    const calculatedAge = calculateAgeFromDob(ad.formatted);
    if (calculatedAge != null) {
      setAge(String(calculatedAge));
    }
  };

  const submit = async () => {
    if (!fullName.trim()) {
      setFormError(t('Enter a name.'));
      return;
    }
    if (!age.trim() && !dobAd) {
      setFormError(t('Enter an approximate age or date of birth.'));
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await patientsApi.create({
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dobAd || undefined,
        approximateAgeYears: dobAd ? undefined : Number(age),
        phone: phone.trim() || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('Unable to register the patient'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Quick-register patient')}
      description={t('Just enough to identify them and carry on — add the rest later from their record.')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            {t('Cancel')}
          </Button>
          <Button onClick={submit} loading={submitting}>
            {t('Register & select')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <Input label={t('Full name')} autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('Date of birth (A.D.)')}
            type="date"
            max={new Date().toISOString().split('T')[0] ?? ''}
            value={dobAd}
            onChange={(e) => handleAdChange(e.target.value)}
          />
          <NepaliDateInput
            label={t('Date of birth (B.S.)')}
            value={dobBs}
            onChange={handleBsChange}
            error={bsError ?? undefined}
            hint={t('e.g. 2050-04-15')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('Gender')}
            options={tOpts(GENDERS)}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          />
          <div>
            <Input
              label={t('Age (years)')}
              type="number"
              min={0}
              max={150}
              value={age}
              hint={
                dobAd
                  ? (getDetailedAge(dobAd)?.years ?? 0) < 2
                    ? `${t('Pediatric')}: ${getDetailedAge(dobAd)?.formatted}`
                    : t('Calculated from DOB')
                  : t('If DOB unknown')
              }
              onChange={(e) => setAge(e.target.value)}
            />
            {!dobAd && Number(age) > 0 && Number(age) <= 130 && (
              <button
                type="button"
                onClick={() => {
                  const estYear = new Date().getFullYear() - Number(age);
                  const estAd = `${estYear}-07-01`;
                  handleAdChange(estAd);
                }}
                className="mt-1 text-xs text-primary hover:underline flex items-center gap-1"
              >
                <span>💡 {t('Estimate DOB:')}</span>
                <span className="font-medium">
                  ~{new Date().getFullYear() - Number(age)}-07-01
                  {adToBs(`${new Date().getFullYear() - Number(age)}-07-01`)
                    ? ` (~${adToBs(`${new Date().getFullYear() - Number(age)}-07-01`)!.year} BS)`
                    : ''}
                </span>
              </button>
            )}
          </div>
        </div>

        <Input label={t('Phone (optional)')} value={phone} onChange={(e) => setPhone(e.target.value)} />

        <p className="text-xs text-muted">
          {t('Need to capture address, ID documents, or billing/payer details now instead?')}{' '}
          <Link to="/app/patients/new" className="text-primary hover:underline">
            {t('Use the full registration page')}
          </Link>
          .
        </p>
      </div>
    </Modal>
  );
}
