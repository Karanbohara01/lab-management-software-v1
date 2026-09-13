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

/**
 * This clinic's own Sparrow SMS account, for report-delivery text messages — overrides the
 * deployment-wide default. A clinic that never configures this keeps using the shared default
 * (if any) seamlessly.
 */
export function SmsCredentialsCard({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => settingsApi.getSmsCredentials(), []);

  const [enabled, setEnabled] = useState(false);
  const [from, setFrom] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setFrom(data.from ?? '');
  }, [data]);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSmsCredentials({ enabled, from: from || undefined, token: token || undefined });
      setToken('');
      toast.success('SMS settings saved');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="SMS delivery"
        description="Your own Sparrow SMS account for texting report links — otherwise this deployment's shared default (if any) is used."
      />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <Checkbox
            label="Use my own Sparrow SMS account"
            checked={enabled}
            disabled={!canWrite}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Badge tone={data.tokenConfigured ? 'success' : 'neutral'}>
            {data.tokenConfigured ? 'Configured' : 'Not configured'}
          </Badge>
        </div>
        {enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Sender identity" value={from} disabled={!canWrite} onChange={(e) => setFrom(e.target.value)} />
            <Input
              label="API token"
              type="password"
              placeholder={data.tokenConfigured ? '•••••••• (leave blank to keep)' : ''}
              value={token}
              disabled={!canWrite}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        )}
        {!canWrite && <Alert tone="info">You have read-only access to settings.</Alert>}
        {canWrite && (
          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              Save SMS settings
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
