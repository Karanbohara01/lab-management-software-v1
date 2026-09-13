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
 * This clinic's own WhatsApp Business Cloud API account, for report-delivery messages — overrides
 * the deployment-wide default. A clinic that never configures this keeps using the shared default
 * (if any) seamlessly. Not live-verified against a real WhatsApp Business Account this session —
 * see WhatsAppCloudApiGateway's javadoc on the backend.
 */
export function WhatsAppCredentialsCard({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => settingsApi.getWhatsAppCredentials(), []);

  const [enabled, setEnabled] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setPhoneNumberId(data.phoneNumberId ?? '');
  }, [data]);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.updateWhatsAppCredentials({
        enabled,
        phoneNumberId: phoneNumberId || undefined,
        accessToken: accessToken || undefined,
      });
      setAccessToken('');
      toast.success('WhatsApp settings saved');
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
        title="WhatsApp delivery"
        description="Your own WhatsApp Business Cloud API account for messaging report links — otherwise this deployment's shared default (if any) is used."
      />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <Checkbox
            label="Use my own WhatsApp Business account"
            checked={enabled}
            disabled={!canWrite}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <Badge tone={data.accessTokenConfigured ? 'success' : 'neutral'}>
            {data.accessTokenConfigured ? 'Configured' : 'Not configured'}
          </Badge>
        </div>
        {enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Phone number id"
              value={phoneNumberId}
              disabled={!canWrite}
              onChange={(e) => setPhoneNumberId(e.target.value)}
            />
            <Input
              label="Access token"
              type="password"
              placeholder={data.accessTokenConfigured ? '•••••••• (leave blank to keep)' : ''}
              value={accessToken}
              disabled={!canWrite}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
        )}
        {!canWrite && <Alert tone="info">You have read-only access to settings.</Alert>}
        {canWrite && (
          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              Save WhatsApp settings
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
