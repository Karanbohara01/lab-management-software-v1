import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ErrorState, LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { communicationApi } from './api';
import type { SmsBalance } from './types';
import { useT } from '@/i18n';

export function SmsConfigPage() {
  const t = useT();
  const { back } = useBackTarget();
  const toast = useToast();

  const { data: statuses, error, refetch } = useQuery(() => communicationApi.config.gatewayStatuses(), []);
  const { data: samaya, refetch: refetchSamaya } = useQuery(() => communicationApi.config.getSamaya(), []);
  const { data: threshold, refetch: refetchThreshold } = useQuery(() => communicationApi.config.getLowBalanceThreshold(), []);

  const [enabled, setEnabled] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [senderId, setSenderId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [thresholdInput, setThresholdInput] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    if (!samaya) return;
    setEnabled(samaya.enabled);
    setBaseUrl(samaya.baseUrl ?? '');
    setSenderId(samaya.senderId ?? '');
  }, [samaya]);

  useEffect(() => {
    setThresholdInput(threshold == null ? '' : String(threshold));
  }, [threshold]);

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const value = thresholdInput.trim() === '' ? null : Number(thresholdInput);
      await communicationApi.config.updateLowBalanceThreshold(value);
      toast.success(value == null ? t('Low-balance alerts disabled') : t('Low-balance alert threshold saved'));
      refetchThreshold();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to save this threshold'));
    } finally {
      setSavingThreshold(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await communicationApi.config.updateSamaya({ enabled, baseUrl, senderId, apiKey: apiKey || undefined });
      toast.success(t('Samaya SMS configuration saved'));
      setApiKey('');
      refetchSamaya();
      refetch();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t('Unable to save this configuration'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        back={back}
        title={t('SMS configuration')}
        description={t('Samaya SMS is the preferred provider when configured; Sparrow SMS is used otherwise.')}
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={t('Gateway status')} />
            <CardBody className="space-y-3">
              {!statuses ? (
                <LoadingState />
              ) : (
                statuses.map((s) => <GatewayRow key={s.provider} provider={s.provider} label={s.label} configured={s.configured} />)
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Samaya SMS account')} description={t("This organization's own account — overrides this deployment's shared configuration.")} />
            <CardBody className="space-y-4">
              {saveError && <Alert tone="danger">{saveError}</Alert>}
              <Checkbox label={t('Enabled')} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <Input label={t('Base URL')} placeholder={t('https://your-install.samayasms.com.np/sms/api')} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              <Input label={t('Sender ID')} value={senderId} onChange={(e) => setSenderId(e.target.value)} />
              <Input
                label={t('API key')}
                type="password"
                placeholder={samaya?.hasApiKey ? t('••••••••  (leave blank to keep the current key)') : ''}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={save} loading={saving}>
                  {t('Save')}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t('Low-balance alerts')}
              description={t('Daily check of your effective provider\'s balance — disabled by default. Leave blank to turn off.')}
            />
            <CardBody className="space-y-4">
              <Input
                label={t('Alert when balance falls below')}
                type="number"
                min={0}
                placeholder={t('e.g. 500')}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
              />
              <p className="text-xs text-muted">
                {t('Only raised when a real, confirmed balance figure is available — never an estimate.')}
              </p>
              <div className="flex justify-end">
                <Button onClick={saveThreshold} loading={savingThreshold}>
                  {t('Save')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}

function GatewayRow({ provider, label, configured }: { provider: 'SAMAYA' | 'SPARROW'; label: string; configured: boolean }) {
  const t = useT();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balance, setBalance] = useState<SmsBalance | null>(null);

  const sendTest = async () => {
    if (!phone.trim()) return;
    setSending(true);
    try {
      const result = await communicationApi.config.sendTest(provider, phone.trim());
      if (result.sent) toast.success(t('Test SMS sent'));
      else toast.error(result.errorMessage ?? t('The test SMS could not be sent'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('The test SMS could not be sent'));
    } finally {
      setSending(false);
    }
  };

  const checkBalance = async () => {
    setCheckingBalance(true);
    try {
      setBalance(await communicationApi.config.balance(provider));
    } finally {
      setCheckingBalance(false);
    }
  };

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge tone={configured ? 'success' : 'neutral'}>{t(configured ? 'Configured' : 'Not configured')}</Badge>
      </div>
      {configured && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input placeholder={t('98XXXXXXXX')} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button variant="secondary" size="sm" onClick={sendTest} loading={sending} disabled={!phone.trim()}>
              {t('Send test')}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={checkBalance} loading={checkingBalance}>
              {t('Check balance')}
            </Button>
            {balance && (
              <span className="text-xs text-muted">
                {balance.available
                  ? balance.balance != null
                    ? t('{balance} credits (unconfirmed field mapping — verify with the provider)', { balance: balance.balance })
                    : t('Raw response: {raw}', { raw: balance.rawResponse ?? '—' })
                  : balance.errorMessage ?? t('Balance unavailable')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
