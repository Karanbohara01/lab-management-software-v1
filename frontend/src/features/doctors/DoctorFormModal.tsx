import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalCancelButton } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { doctorsApi } from './api';
import type { Doctor, DoctorUpsertPayload } from './types';
import { useT } from '@/i18n';

const schema = z.object({
  fullName: z.string().min(1, 'Name is required').max(160),
  specialization: z.string().max(120).optional(),
  qualification: z.string().max(160).optional(),
  nmcNumber: z.string().max(40).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email('Enter a valid email').max(160).or(z.literal('')).optional(),
  affiliatedOrganization: z.string().max(200).optional(),
  commissionRate: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 0 && Number(v) <= 100), 'Must be between 0 and 100'),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  fullName: '',
  specialization: '',
  qualification: '',
  nmcNumber: '',
  phone: '',
  email: '',
  affiliatedOrganization: '',
  commissionRate: '',
};

export function DoctorFormModal({
  open,
  onClose,
  doctor,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      doctor
        ? {
            fullName: doctor.fullName,
            specialization: doctor.specialization ?? '',
            qualification: doctor.qualification ?? '',
            nmcNumber: doctor.nmcNumber ?? '',
            phone: doctor.phone ?? '',
            email: doctor.email ?? '',
            affiliatedOrganization: doctor.affiliatedOrganization ?? '',
            commissionRate: doctor.commissionRate != null ? String(doctor.commissionRate) : '',
          }
        : EMPTY,
    );
  }, [open, doctor, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: DoctorUpsertPayload = {
      fullName: values.fullName.trim(),
      specialization: values.specialization || undefined,
      qualification: values.qualification || undefined,
      nmcNumber: values.nmcNumber || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      affiliatedOrganization: values.affiliatedOrganization || undefined,
      commissionRate: values.commissionRate ? Number(values.commissionRate) : null,
    };
    try {
      if (doctor) {
        await doctorsApi.update(doctor.id, payload);
        toast.success(t('Doctor updated'));
      } else {
        await doctorsApi.create(payload);
        toast.success(t('Doctor added'));
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        err.fieldErrors.forEach((fe) => setError(fe.field as keyof FormValues, { message: fe.message }));
        if (err.fieldErrors.length === 0) setError('root', { message: err.message });
      } else {
        setError('root', { message: t('Unable to save doctor') });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? t('Edit referring doctor') : t('Add referring doctor')}
      size="lg"
      confirmClose={isDirty && !isSubmitting}
      footer={
        <>
          <ModalCancelButton />
          <Button type="submit" form="doctor-form" loading={isSubmitting}>
            {doctor ? t('Save changes') : t('Add doctor')}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Input label={t('Full name')} error={errors.fullName?.message} {...register('fullName')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('Specialization')} error={errors.specialization?.message} {...register('specialization')} />
          <Input label={t('Qualification')} error={errors.qualification?.message} {...register('qualification')} />
          <Input label={t('NMC number')} error={errors.nmcNumber?.message} {...register('nmcNumber')} />
          <Input label={t('Phone')} error={errors.phone?.message} {...register('phone')} />
          <Input label={t('Email')} type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label={t('Affiliated organization')}
            error={errors.affiliatedOrganization?.message}
            {...register('affiliatedOrganization')}
          />
          <Input
            label={t('Commission rate %')}
            type="number"
            step="any"
            min={0}
            max={100}
            hint={t('% of taxable invoice value earned on orders this doctor refers. Leave blank for no commission.')}
            error={errors.commissionRate?.message}
            {...register('commissionRate')}
          />
        </div>
      </form>
    </Modal>
  );
}
