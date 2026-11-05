import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { settingsApi } from './api';
import { useT } from '@/i18n';

/**
 * This clinic's own IRD/CBMS taxpayer credentials — overrides the deployment-wide default for
 * electronic bill submission. A clinic that never configures this keeps using the shared default
 * (if any) seamlessly; only clinics with their own IRD registration need to touch this card.
 */
export function IrdCredentialsCard({ canWrite }: { canWrite: boolean }) {
  const t = useT();
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => settingsApi.getIrdCredentials(), []);

  const [enabled, setEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [sellerPan, setSellerPan] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setUsername(data.username ?? '');
    setSellerPan(data.sellerPan ?? '');
  }, [data]);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.updateIrdCredentials({
        enabled,
        username: username || undefined,
        sellerPan: sellerPan || undefined,
        password: password || undefined,
      });
      setPassword('');
      toast.success(t('IRD credentials saved'));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t('IRD / e-Billing')}
        description={t("Your own CBMS taxpayer login, if you're IRD-registered — otherwise this deployment's shared default (if any) is used.")}
      />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <Checkbox
            label={t('Use my own IRD credentials')}
            checked={enabled}
            disabled={!canWrite}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Badge tone={data.passwordConfigured ? 'success' : 'neutral'}>
            {data.passwordConfigured ? t('Configured') : t('Not configured')}
          </Badge>
        </div>
        {enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t('IRD username')} value={username} disabled={!canWrite} onChange={(e) => setUsername(e.target.value)} />
            <Input label={t('Seller PAN')} value={sellerPan} disabled={!canWrite} onChange={(e) => setSellerPan(e.target.value)} />
            <Input
              label={t('IRD password')}
              type="password"
              placeholder={data.passwordConfigured ? t('•••••••• (leave blank to keep)') : ''}
              value={password}
              disabled={!canWrite}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {!canWrite && <Alert tone="info">{t('You have read-only access to settings.')}</Alert>}
        {canWrite && (
          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              {t('Save IRD settings')}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
