import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { communicationApi } from '../api';
import { SMS_CATEGORY_LABEL, type SmsTemplate } from '../types';
import { useT } from '@/i18n';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(160),
  category: z.string().min(1),
  body: z.string().min(1, 'Message body is required').max(1000),
});
type FormValues = z.infer<typeof schema>;

const CATEGORY_OPTIONS = Object.entries(SMS_CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

export function SmsTemplateFormModal({
  open,
  onClose,
  template,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  template: SmsTemplate | null;
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(template ? { name: template.name, category: template.category, body: template.body } : { name: '', category: 'GENERAL_ANNOUNCEMENT', body: '' });
  }, [open, template, reset]);

  const body = watch('body') ?? '';

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = { name: values.name.trim(), category: values.category as SmsTemplate['category'], body: values.body.trim() };
      if (template) {
        await communicationApi.templates.update(template.id, payload);
        toast.success(t('Template updated'));
      } else {
        await communicationApi.templates.create(payload);
        toast.success(t('Template created'));
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        err.fieldErrors.forEach((fe) => setError(fe.field as keyof FormValues, { message: fe.message }));
        if (err.fieldErrors.length === 0) setError('root', { message: err.message });
      } else {
        setError('root', { message: t('Unable to save this template') });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template ? t('Edit template') : t('New template')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form="sms-template-form" loading={isSubmitting}>
            {template ? t('Save changes') : t('Create template')}
          </Button>
        </>
      }
    >
      <form id="sms-template-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <Input label={t('Name')} error={errors.name?.message} {...register('name')} />
        <Select label={t('Category')} options={CATEGORY_OPTIONS} error={errors.category?.message} {...register('category')} />
        <div>
          <Textarea label={t('Message body')} rows={4} maxLength={1000} error={errors.body?.message} {...register('body')} />
          <p className="mt-1 text-xs text-muted">
            {t('{count}/1000 characters. Placeholders: {patientName}, {mrn}, {labName}, {appointmentDate}, {reportNumber}, {invoiceNumber}, {amount}', {
              count: body.length,
            })}
          </p>
        </div>
      </form>
    </Modal>
  );
}
