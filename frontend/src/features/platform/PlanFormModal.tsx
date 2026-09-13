import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { platformApi } from './api';
import type { Plan } from './types';

const schema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, digits, - and _ only'),
  name: z.string().min(1, 'Name is required').max(120),
  priceMonthly: z.coerce.number().min(0, 'Must be 0 or more'),
  maxUsers: z.coerce.number().int().min(1, 'At least 1'),
  maxBranches: z.coerce.number().int().min(1, 'At least 1'),
  description: z.string().max(500).optional(),
  active: z.boolean(),
  displayOrder: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof schema>;

/** Create or edit a subscription plan. The `code` is fixed once a plan exists — creating a new
 * code makes a new plan; reusing an existing plan's code updates it in place (server-side upsert
 * keyed by code). */
export function PlanFormModal({
  open,
  onClose,
  plan,
  nextDisplayOrder,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  nextDisplayOrder: number;
  onSaved: () => void;
}) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(
      plan
        ? {
            code: plan.code,
            name: plan.name,
            priceMonthly: plan.priceMonthly,
            maxUsers: plan.maxUsers,
            maxBranches: plan.maxBranches,
            description: plan.description ?? '',
            active: plan.active,
            displayOrder: plan.displayOrder,
          }
        : {
            code: '',
            name: '',
            priceMonthly: 0,
            maxUsers: 5,
            maxBranches: 1,
            description: '',
            active: true,
            displayOrder: nextDisplayOrder,
          },
    );
  }, [open, plan, nextDisplayOrder, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await platformApi.upsertPlan({ ...values, description: values.description || undefined });
      toast.success(plan ? 'Plan updated' : 'Plan created');
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError('root', { message: err.message });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? `Edit ${plan.name}` : 'New plan'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            {...register('code')}
            error={errors.code?.message}
            disabled={!!plan}
            data-autofocus={!plan || undefined}
          />
          <Input label="Name" {...register('name')} error={errors.name?.message} data-autofocus={plan ? true : undefined} />
          <Input label="Price / month (NPR)" type="number" step="0.01" {...register('priceMonthly')} error={errors.priceMonthly?.message} />
          <Input label="Display order" type="number" {...register('displayOrder')} error={errors.displayOrder?.message} />
          <Input label="Max users" type="number" {...register('maxUsers')} error={errors.maxUsers?.message} />
          <Input label="Max branches" type="number" {...register('maxBranches')} error={errors.maxBranches?.message} />
        </div>
        <Textarea label="Description" {...register('description')} error={errors.description?.message} />
        <Checkbox label="Active (offered when onboarding a new clinic)" {...register('active')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {plan ? 'Save changes' : 'Create plan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
