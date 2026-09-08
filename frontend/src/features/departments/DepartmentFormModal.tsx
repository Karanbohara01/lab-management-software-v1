import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { departmentsApi, type Department } from './api';

const schema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(24)
    .regex(/^[A-Za-z0-9_-]+$/, 'Letters, digits, - and _ only'),
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function DepartmentFormModal({
  open,
  onClose,
  department,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  department: Department | null;
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
      department
        ? { code: department.code, name: department.name, description: department.description ?? '' }
        : { code: '', name: '', description: '' },
    );
  }, [open, department, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (department) {
        await departmentsApi.update(department.id, { name: values.name.trim(), description: values.description || undefined });
        toast.success('Department updated');
      } else {
        await departmentsApi.create({
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description || undefined,
        });
        toast.success('Department created');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        err.fieldErrors.forEach((fe) => setError(fe.field as keyof FormValues, { message: fe.message }));
        if (err.fieldErrors.length === 0) setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Unable to save department' });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? 'Edit department' : 'New department'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" loading={isSubmitting}>
            {department ? 'Save changes' : 'Create department'}
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Input
          label="Code"
          hint="Short unique identifier, e.g. HAEM"
          disabled={!!department}
          error={errors.code?.message}
          {...register('code')}
        />
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} />
      </form>
    </Modal>
  );
}
