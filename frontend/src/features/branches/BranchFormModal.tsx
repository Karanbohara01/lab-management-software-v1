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
import { branchesApi, type Branch } from './api';

const schema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(24)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, digits, - and _ only'),
  name: z.string().min(1, 'Name is required').max(160),
  addressLine: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  phone: z.string().max(64).optional(),
  email: z.union([z.literal(''), z.string().email().max(160)]).optional(),
});
type FormValues = z.infer<typeof schema>;

export function BranchFormModal({
  open,
  onClose,
  branch,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  branch: Branch | null;
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
      branch
        ? {
            code: branch.code,
            name: branch.name,
            addressLine: branch.addressLine ?? '',
            city: branch.city ?? '',
            phone: branch.phone ?? '',
            email: branch.email ?? '',
          }
        : { code: '', name: '', addressLine: '', city: '', phone: '', email: '' },
    );
  }, [open, branch, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      addressLine: values.addressLine || undefined,
      city: values.city || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
    };
    try {
      if (branch) {
        await branchesApi.update(branch.id, payload);
        toast.success('Branch updated');
      } else {
        await branchesApi.create({ code: values.code.trim().toUpperCase(), ...payload });
        toast.success('Branch created');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        err.fieldErrors.forEach((fe) => setError(fe.field as keyof FormValues, { message: fe.message }));
        if (err.fieldErrors.length === 0) setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Unable to save branch' });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={branch ? 'Edit branch' : 'New branch'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="branch-form" loading={isSubmitting}>
            {branch ? 'Save changes' : 'Create branch'}
          </Button>
        </>
      }
    >
      <form id="branch-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Input
          label="Code"
          hint="Short unique identifier, e.g. PKR"
          disabled={!!branch}
          error={errors.code?.message}
          {...register('code')}
        />
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Address" error={errors.addressLine?.message} {...register('addressLine')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" error={errors.city?.message} {...register('city')} />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        </div>
        <Input label="Email" error={errors.email?.message} {...register('email')} />
      </form>
    </Modal>
  );
}
