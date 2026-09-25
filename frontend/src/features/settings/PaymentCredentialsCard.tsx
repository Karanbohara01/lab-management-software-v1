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
 * This clinic's own eSewa/Khalti credentials — overrides the deployment-wide default for online
 * payment. A clinic that never configures this keeps using the shared default seamlessly; only
 * clinics that want their own merchant account need to touch this card.
 */
export function PaymentCredentialsCard({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => settingsApi.getPaymentCredentials(), []);

  const [esewaEnabled, setEsewaEnabled] = useState(false);
  const [esewaMerchantCode, setEsewaMerchantCode] = useState('');
  const [esewaSecretKey, setEsewaSecretKey] = useState('');
  const [khaltiEnabled, setKhaltiEnabled] = useState(false);
  const [khaltiSecretKey, setKhaltiSecretKey] = useState('');
  const [fonepayEnabled, setFonepayEnabled] = useState(false);
  const [fonepayMerchantCode, setFonepayMerchantCode] = useState('');
  const [fonepaySecretKey, setFonepaySecretKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEsewaEnabled(data.esewaEnabled);
    setEsewaMerchantCode(data.esewaMerchantCode ?? '');
    setKhaltiEnabled(data.khaltiEnabled);
    setFonepayEnabled(data.fonepayEnabled);
    setFonepayMerchantCode(data.fonepayMerchantCode ?? '');
  }, [data]);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.updatePaymentCredentials({
        esewaEnabled,
        esewaMerchantCode: esewaMerchantCode || undefined,
        esewaSecretKey: esewaSecretKey || undefined,
        khaltiEnabled,
        khaltiSecretKey: khaltiSecretKey || undefined,
        fonepayEnabled,
        fonepayMerchantCode: fonepayMerchantCode || undefined,
        fonepaySecretKey: fonepaySecretKey || undefined,
      });
      setEsewaSecretKey('');
      setKhaltiSecretKey('');
      setFonepaySecretKey('');
      toast.success('Payment gateway settings saved');
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
        title="Payment gateways"
        description="Your own eSewa/Khalti merchant credentials, if you have one — otherwise this deployment's shared default is used."
      />
      <CardBody className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Checkbox
              label="Use my own eSewa merchant account"
              checked={esewaEnabled}
              disabled={!canWrite}
              onChange={(e) => setEsewaEnabled(e.target.checked)}
            />
            <Badge tone={data.esewaSecretConfigured ? 'success' : 'neutral'}>
              {data.esewaSecretConfigured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
          {esewaEnabled && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Merchant code"
                value={esewaMerchantCode}
                disabled={!canWrite}
                onChange={(e) => setEsewaMerchantCode(e.target.value)}
              />
              <Input
                label="Secret key"
                type="password"
                placeholder={data.esewaSecretConfigured ? '•••••••• (leave blank to keep)' : ''}
                value={esewaSecretKey}
                disabled={!canWrite}
                onChange={(e) => setEsewaSecretKey(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Checkbox
              label="Use my own Khalti merchant account"
              checked={khaltiEnabled}
              disabled={!canWrite}
              onChange={(e) => setKhaltiEnabled(e.target.checked)}
            />
            <Badge tone={data.khaltiSecretConfigured ? 'success' : 'neutral'}>
              {data.khaltiSecretConfigured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
          {khaltiEnabled && (
            <Input
              label="Secret key"
              type="password"
              placeholder={data.khaltiSecretConfigured ? '•••••••• (leave blank to keep)' : ''}
              value={khaltiSecretKey}
              disabled={!canWrite}
              onChange={(e) => setKhaltiSecretKey(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Checkbox
              label="Use my own Fonepay merchant account"
              checked={fonepayEnabled}
              disabled={!canWrite}
              onChange={(e) => setFonepayEnabled(e.target.checked)}
            />
            <Badge tone={data.fonepaySecretConfigured ? 'success' : 'neutral'}>
              {data.fonepaySecretConfigured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
          {fonepayEnabled && (
            <>
              <Alert tone="warning">
                Fonepay checkout isn't wired up yet — credentials are saved for when it is, but no payment can be taken
                through Fonepay from this system today.
              </Alert>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Merchant code"
                  value={fonepayMerchantCode}
                  disabled={!canWrite}
                  onChange={(e) => setFonepayMerchantCode(e.target.value)}
                />
                <Input
                  label="Secret key"
                  type="password"
                  placeholder={data.fonepaySecretConfigured ? '•••••••• (leave blank to keep)' : ''}
                  value={fonepaySecretKey}
                  disabled={!canWrite}
                  onChange={(e) => setFonepaySecretKey(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {!canWrite && <Alert tone="info">You have read-only access to settings.</Alert>}
        {canWrite && (
          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              Save payment settings
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
