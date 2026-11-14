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
import { communicationApi } from '../api';
import { useT } from '@/i18n';

const schema = z.object({
  dueDate: z.string().min(1, 'Due date is required'),
  reason: z.string().max(255).optional(),
});
type FormValues = z.infer<typeof schema>;

export function FollowUpModal({
  open,
  onClose,
  patientId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  patientId: number;
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { dueDate: '', reason: '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await communicationApi.followUps.create({ patientId, dueDate: values.dueDate, reason: values.reason?.trim() || undefined });
      toast.success(t('Follow-up scheduled'));
      reset();
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError('root', { message: err.message });
      else setError('root', { message: t('Unable to schedule this follow-up') });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Schedule follow-up')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form="follow-up-form" loading={isSubmitting}>
            {t('Schedule')}
          </Button>
        </>
      }
    >
      <form id="follow-up-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Input type="date" label={t('Due date')} error={errors.dueDate?.message} {...register('dueDate')} />
        <Textarea label={t('Reason (optional)')} rows={3} error={errors.reason?.message} {...register('reason')} />
      </form>
    </Modal>
  );
}
