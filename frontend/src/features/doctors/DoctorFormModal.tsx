import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { doctorsApi } from './api';
import type { Doctor, DoctorUpsertPayload } from './types';

const schema = z.object({
  fullName: z.string().min(1, 'Name is required').max(160),
  specialization: z.string().max(120).optional(),
  qualification: z.string().max(160).optional(),
  nmcNumber: z.string().max(40).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email('Enter a valid email').max(160).or(z.literal('')).optional(),
  affiliatedOrganization: z.string().max(200).optional(),
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
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
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
    };
    try {
      if (doctor) {
        await doctorsApi.update(doctor.id, payload);
        toast.success('Doctor updated');
      } else {
        await doctorsApi.create(payload);
        toast.success('Doctor added');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        err.fieldErrors.forEach((fe) => setError(fe.field as keyof FormValues, { message: fe.message }));
        if (err.fieldErrors.length === 0) setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Unable to save doctor' });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? 'Edit referring doctor' : 'Add referring doctor'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" loading={isSubmitting}>
            {doctor ? 'Save changes' : 'Add doctor'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
          <Input label="Qualification" error={errors.qualification?.message} {...register('qualification')} />
          <Input label="NMC number" error={errors.nmcNumber?.message} {...register('nmcNumber')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Affiliated organization"
            error={errors.affiliatedOrganization?.message}
            {...register('affiliatedOrganization')}
          />
        </div>
      </form>
    </Modal>
  );
}
