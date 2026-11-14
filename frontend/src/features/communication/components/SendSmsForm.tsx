import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, User, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { PatientPicker } from '@/features/patients/PatientPicker';
import type { PatientListItem } from '@/features/patients/types';
import { communicationApi } from '../api';
import { SMS_CATEGORY_LABEL, type SmsCategory } from '../types';
import { useT } from '@/i18n';

const schema = z
  .object({
    phone: z.string().min(1, 'Phone number is required'),
    recipientName: z.string().optional(),
    category: z.string().min(1),
    templateId: z.string().optional(),
    messageBody: z.string().optional(),
  })
  .refine((v) => !!v.templateId || !!v.messageBody?.trim(), {
    message: 'Write a message or choose a template',
    path: ['messageBody'],
  });
type FormValues = z.infer<typeof schema>;

const CATEGORY_OPTIONS = Object.entries(SMS_CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

// Kept byte-for-byte in sync with the backend's SmsSegmentCalculator.GSM7_BASIC / GSM7_EXTENSION —
// NOT the full ASCII range, since a few printable ASCII characters (backslash, backtick) are
// genuinely outside the GSM 03.38 alphabet and must fall back to Unicode just like the server does.
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM7_EXTENSION = '{}[]~^|€';

/** GSM-7 / UCS-2 segment estimate mirroring the backend's SmsSegmentCalculator — a live preview only. */
function estimateSegments(text: string): { segments: number; encoding: 'GSM-7' | 'Unicode' } {
  const isGsm7 = [...text].every((ch) => GSM7_BASIC.includes(ch) || GSM7_EXTENSION.includes(ch));
  const len = text.length;
  if (len === 0) return { segments: 0, encoding: isGsm7 ? 'GSM-7' : 'Unicode' };
  const singleLimit = isGsm7 ? 160 : 70;
  const concatLimit = isGsm7 ? 153 : 67;
  const segments = len <= singleLimit ? 1 : Math.ceil(len / concatLimit);
  return { segments, encoding: isGsm7 ? 'GSM-7' : 'Unicode' };
}

export function SendSmsForm({
  patientId,
  defaultPhone,
  defaultName,
  onSent,
}: {
  patientId?: number;
  defaultPhone?: string;
  defaultName?: string;
  onSent?: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const [result, setResult] = useState<{ sent: boolean; errorMessage: string | null } | null>(null);
  const { data: templates } = useQuery(() => communicationApi.templates.list(), []);

  // When opened without a fixed patientId (the standalone Send SMS page, not a patient's own
  // record), let staff search for and pick a recipient instead of always typing a raw number —
  // mirrors the PatientPicker used by the order builder and appointment form. "Enter a number
  // manually" stays available for non-patient recipients (a referring doctor, a vendor, etc.).
  const lockedToPatient = !!patientId;
  const [pickedPatient, setPickedPatient] = useState<PatientListItem | null>(null);
  const [manualEntry, setManualEntry] = useState(lockedToPatient);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: defaultPhone ?? '', recipientName: defaultName ?? '', category: 'GENERAL_ANNOUNCEMENT' },
  });

  const selectPatient = (p: PatientListItem) => {
    setPickedPatient(p);
    setValue('phone', p.phone ?? '', { shouldValidate: true });
    setValue('recipientName', p.fullName);
  };

  const clearPickedPatient = () => {
    setPickedPatient(null);
    setValue('phone', '');
    setValue('recipientName', '');
  };

  const templateId = watch('templateId');
  const activeTemplates = useMemo(() => (templates ?? []).filter((tpl) => tpl.active), [templates]);

  useEffect(() => {
    if (!templateId) return;
    const tpl = activeTemplates.find((x) => String(x.id) === templateId);
    if (tpl) {
      setValue('category', tpl.category);
      setValue('messageBody', '');
    }
  }, [templateId, activeTemplates, setValue]);

  const messageBody = watch('messageBody') ?? '';
  const usingTemplate = !!templateId;
  const estimate = estimateSegments(usingTemplate ? '' : messageBody);

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    try {
      const response = await communicationApi.messages.send({
        patientId: patientId ?? pickedPatient?.id,
        phone: values.phone.trim(),
        recipientName: values.recipientName?.trim() || undefined,
        category: values.category as SmsCategory,
        templateId: values.templateId ? Number(values.templateId) : undefined,
        messageBody: values.templateId ? undefined : values.messageBody?.trim(),
      });
      setResult({ sent: response.sent, errorMessage: response.errorMessage });
      if (response.sent) {
        toast.success(t('SMS sent'));
        setValue('messageBody', '');
        if (!lockedToPatient) clearPickedPatient();
        onSent?.();
      } else {
        toast.error(t('The SMS could not be sent'));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        err.fieldErrors.forEach((fe) => setError(fe.field as keyof FormValues, { message: fe.message }));
        if (err.fieldErrors.length === 0) setError('root', { message: err.message });
      } else {
        setError('root', { message: t('Unable to send this message') });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
      {result && !result.sent && (
        <Alert tone="danger">{result.errorMessage ?? t('The SMS could not be sent')}</Alert>
      )}
      {result?.sent && <Alert tone="success">{t('Message accepted by the SMS gateway.')}</Alert>}

      {lockedToPatient ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('Phone number')}
            placeholder={t('98XXXXXXXX')}
            disabled={!!defaultPhone}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input label={t('Recipient name')} error={errors.recipientName?.message} {...register('recipientName')} />
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('Recipient')}</label>
          {pickedPatient ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted">
                  <User className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{pickedPatient.fullName}</p>
                  <p className="text-xs text-muted">
                    {pickedPatient.mrn}
                    {pickedPatient.phone ? ` · ${pickedPatient.phone}` : ` · ${t('No phone on file')}`}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearPickedPatient}>
                <X className="h-3.5 w-3.5" aria-hidden />
                {t('Change')}
              </Button>
            </div>
          ) : manualEntry ? (
            <div className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder={t('98XXXXXXXX')}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <Input placeholder={t('Recipient name (optional)')} error={errors.recipientName?.message} {...register('recipientName')} />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setManualEntry(false)}>
                {t('Search for a patient instead')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <PatientPicker onSelect={selectPatient} />
              <Button type="button" variant="ghost" size="sm" onClick={() => setManualEntry(true)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {t('Enter a phone number manually instead')}
              </Button>
            </div>
          )}
          {pickedPatient && !pickedPatient.phone && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input
                label={t('Phone number')}
                placeholder={t('98XXXXXXXX')}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t('Category')} options={CATEGORY_OPTIONS} error={errors.category?.message} {...register('category')} />
        <Controller
          control={control}
          name="templateId"
          render={({ field }) => (
            <Select
              label={t('Template (optional)')}
              placeholder={t('No template — write a custom message')}
              options={activeTemplates.map((tpl) => ({ value: String(tpl.id), label: tpl.name }))}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {!usingTemplate && (
        <div>
          <Textarea
            label={t('Message')}
            rows={4}
            maxLength={1000}
            error={errors.messageBody?.message}
            {...register('messageBody')}
          />
          <p className="mt-1 text-xs text-muted">
            {t('{count} characters · {segments} segment(s) · {encoding}', {
              count: messageBody.length,
              segments: estimate.segments,
              encoding: estimate.encoding,
            })}
          </p>
        </div>
      )}
      {usingTemplate && (
        <p className="text-xs text-muted">
          {t('Placeholders like {patientName} and {mrn} are filled in automatically when this is sent.')}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {t('Send SMS')}
        </Button>
      </div>
    </form>
  );
}
