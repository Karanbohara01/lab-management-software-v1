import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget, useNavigateFrom } from '@/lib/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { communicationApi } from './api';
import { RecipientFilterFields } from './components/RecipientFilterFields';
import { SMS_CATEGORY_LABEL, type RecipientFilter, type RecipientPreview, type SmsCategory } from './types';
import { useT } from '@/i18n';

const CATEGORY_OPTIONS = Object.entries(SMS_CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

function apiErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function CampaignBuilderPage() {
  const t = useT();
  const { back } = useBackTarget();
  const navigate = useNavigateFrom();
  const toast = useToast();
  const { data: templates } = useQuery(() => communicationApi.templates.list(), []);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SmsCategory>('GENERAL_ANNOUNCEMENT');
  const [templateId, setTemplateId] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [filter, setFilter] = useState<RecipientFilter>({ type: 'ALL_PATIENTS' });
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTemplates = (templates ?? []).filter((tpl) => tpl.active);
  const effectiveBody = templateId ? activeTemplates.find((tpl) => String(tpl.id) === templateId)?.body ?? '' : messageBody;

  const runPreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      const result = await communicationApi.campaigns.preview({ recipientFilter: filter, messageBody: effectiveBody });
      setPreview(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Unable to estimate recipients'));
    } finally {
      setPreviewing(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      setError(t('Give the campaign a name'));
      return;
    }
    if (!effectiveBody.trim()) {
      setError(t('Write a message or choose a template'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const campaign = await communicationApi.campaigns.create({
        name: name.trim(),
        templateId: templateId ? Number(templateId) : undefined,
        messageBody: effectiveBody,
        category,
        recipientFilter: filter,
      });
      try {
        await communicationApi.campaigns.confirm(campaign.id, {
          scheduledAt: scheduleLater && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        });
        toast.success(t('Campaign queued'));
      } catch (confirmErr) {
        toast.error(apiErrorMessage(confirmErr, t('Could not stage recipients — you can retry from the campaign page')));
      }
      navigate(`/app/communication/campaigns/${campaign.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, t('Unable to create this campaign')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader back={back} title={t('New SMS campaign')} description={t('Message many patients at once, sent in rate-limited background batches.')} />

      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('Message')} />
          <CardBody className="space-y-4">
            <Input label={t('Campaign name')} value={name} onChange={(e) => setName(e.target.value)} />
            <Select
              label={t('Category')}
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value as SmsCategory)}
            />
            <Select
              label={t('Template (optional)')}
              placeholder={t('No template — write a custom message')}
              options={activeTemplates.map((tpl) => ({ value: String(tpl.id), label: tpl.name }))}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
            {!templateId && (
              <Textarea
                label={t('Message body')}
                rows={5}
                maxLength={1000}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
            )}
            {templateId && <p className="text-xs text-muted">{t('Using the selected template. Placeholders fill in per recipient.')}</p>}

            <div className="border-t border-border pt-4">
              <Checkbox
                label={t('Schedule for later')}
                checked={scheduleLater}
                onChange={(e) => setScheduleLater(e.target.checked)}
              />
              {scheduleLater && (
                <div className="mt-3">
                  <DateTimePicker
                    label={t('Send at (Asia/Kathmandu)')}
                    value={scheduledAt}
                    onChange={setScheduledAt}
                    minDate={new Date()}
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Recipients')} />
          <CardBody className="space-y-4">
            <RecipientFilterFields value={filter} onChange={setFilter} />

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={runPreview} loading={previewing}>
                {t('Estimate recipients')}
              </Button>
            </div>

            {preview && (
              <div className="rounded-md border border-border bg-surface-muted p-3 text-sm">
                <p className="font-medium text-foreground">
                  {t('{count} recipient(s) will receive this message', { count: preview.recipientCount })}
                </p>
                <p className="mt-1 text-muted">
                  {t('{invalid} invalid number(s) skipped · {optedOut} opted-out number(s) skipped · {segments} segment(s) per recipient ({encoding})', {
                    invalid: preview.invalidPhoneCount,
                    optedOut: preview.optedOutCount,
                    segments: preview.estimatedSegments,
                    encoding: preview.encoding,
                  })}
                </p>
                {preview.capped && <p className="mt-1 text-warning">{t('The recipient list was capped — contact support to send to more at once.')}</p>}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/app/communication/campaigns')}>
          {t('Cancel')}
        </Button>
        <Button onClick={submit} loading={submitting}>
          {scheduleLater ? t('Schedule campaign') : t('Create & send now')}
        </Button>
      </div>
    </>
  );
}
