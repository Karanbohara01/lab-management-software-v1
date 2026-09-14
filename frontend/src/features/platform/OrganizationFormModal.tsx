import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { platformApi } from './api';
import type { Plan } from './types';

const createSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits and - only'),
  name: z.string().min(1, 'Clinic name is required').max(160),
  contactName: z.string().max(160).optional(),
  contactEmail: z.union([z.literal(''), z.string().email().max(160)]).optional(),
  contactPhone: z.string().max(32).optional(),
  city: z.string().max(120).optional(),
  pan: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  planCode: z.string().min(1, 'Choose a plan'),
  adminUsername: z
    .string()
    .min(1, 'Username is required')
    .max(64)
    .regex(/^[A-Za-z0-9_.-]+$/, 'Letters, digits, - . and _ only'),
  adminEmail: z.string().min(1, 'Email is required').email().max(160),
  adminFullName: z.string().min(1, "Admin's name is required").max(160),
  adminPassword: z.string().min(8, 'At least 8 characters').max(100),
});
type FormValues = z.infer<typeof createSchema>;

/** Onboard a new clinic (tenant) into the platform registry with its initial subscription. */
export function OrganizationFormModal({
  open,
  onClose,
  plans,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  plans: Plan[];
  onSaved: () => void;
}) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(createSchema) });

  useEffect(() => {
    if (!open) return;
    reset({
      slug: '',
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      city: '',
      pan: '',
      notes: '',
      planCode: plans.find((p) => p.active)?.code ?? '',
      adminUsername: '',
      adminEmail: '',
      adminFullName: '',
      adminPassword: '',
    });
  }, [open, plans, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await platformApi.createOrganization({
        ...values,
        contactName: values.contactName || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        city: values.city || undefined,
        pan: values.pan || undefined,
        notes: values.notes || undefined,
      });
      toast.success('Clinic onboarded');
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError('root', { message: err.message });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Onboard a new clinic" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Alert tone="info">
          This registers the clinic, starts a subscription, and gives it its own isolated data,
          default letterhead settings, and a first Lab Administrator login — share those
          credentials with them, or have them reset the password after their first sign-in.
        </Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Clinic name" {...register('name')} error={errors.name?.message} data-autofocus />
          <Input label="Slug" placeholder="e.g. marici-labs" {...register('slug')} error={errors.slug?.message} />
          <Input label="Contact name" {...register('contactName')} error={errors.contactName?.message} />
          <Input label="Contact email" {...register('contactEmail')} error={errors.contactEmail?.message} />
          <Input label="Contact phone" {...register('contactPhone')} error={errors.contactPhone?.message} />
          <Input label="City" {...register('city')} error={errors.city?.message} />
          <Input
            label="PAN"
            placeholder="Clinic's own PAN (for IRD e-billing)"
            {...register('pan')}
            error={errors.pan?.message}
          />
        </div>
        <Select
          label="Subscription plan"
          {...register('planCode')}
          error={errors.planCode?.message}
          options={plans
            .filter((p) => p.active)
            .map((p) => ({ value: p.code, label: `${p.name} — NPR ${p.priceMonthly}/mo` }))}
        />
        <Textarea label="Notes" {...register('notes')} error={errors.notes?.message} />

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">First admin login</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Username" {...register('adminUsername')} error={errors.adminUsername?.message} />
            <Input label="Admin email" {...register('adminEmail')} error={errors.adminEmail?.message} />
            <Input label="Admin full name" {...register('adminFullName')} error={errors.adminFullName?.message} />
            <Input
              label="Temporary password"
              type="password"
              {...register('adminPassword')}
              error={errors.adminPassword?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Onboard clinic
          </Button>
        </div>
      </form>
    </Modal>
  );
}
