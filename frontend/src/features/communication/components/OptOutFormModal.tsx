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
  phone: z.string().min(1, 'Phone number is required'),
  reason: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function OptOutFormModal({
  open,
  onClose,
  defaultPhone,
  patientId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultPhone?: string;
  patientId?: number;
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
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: defaultPhone ?? '', reason: '', note: '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await communicationApi.optOuts.add({
        phone: values.phone.trim(),
        patientId,
        reason: values.reason?.trim() || undefined,
        note: values.note?.trim() || undefined,
      });
      toast.success(t('Number added to the do-not-contact list'));
      reset();
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError('root', { message: err.message });
      else setError('root', { message: t('Unable to add this number') });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Opt out a number')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form="opt-out-form" loading={isSubmitting}>
            {t('Opt out')}
          </Button>
        </>
      }
    >
      <form id="opt-out-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <p className="text-sm text-muted">
          {t('This number will never be sent an SMS by this system again — manual, automated, or campaign — until it is removed from this list.')}
        </p>
        <Input
          label={t('Phone number')}
          placeholder={t('98XXXXXXXX')}
          disabled={!!defaultPhone}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input label={t('Reason (optional)')} placeholder={t('e.g. Asked to stop by phone call')} error={errors.reason?.message} {...register('reason')} />
        <Textarea label={t('Note (optional)')} rows={2} error={errors.note?.message} {...register('note')} />
      </form>
    </Modal>
  );
}
