import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { platformBillingApi } from './api';

/**
 * This deployment's own shared CBMS taxpayer login — used to file SUBSCRIPTION invoices (what the
 * platform charges each clinic) with IRD. A clinic's own IRD credentials (set in ITS OWN Settings)
 * are entirely separate and only affect that clinic's own patient billing.
 */
export function PlatformIrdCredentialsCard({ onSaved }: { onSaved?: () => void }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => platformBillingApi.getCredentials(), []);

  const [enabled, setEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [sellerPan, setSellerPan] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setUsername(data.username ?? '');
    setSellerPan(data.sellerPan ?? '');
    setSellerName(data.sellerName ?? '');
  }, [data]);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const save = async () => {
    setSaving(true);
    try {
      await platformBillingApi.updateCredentials({
        enabled,
        username: username || undefined,
        sellerPan: sellerPan || undefined,
        sellerName: sellerName || undefined,
        password: password || undefined,
      });
      setPassword('');
      toast.success('IRD credentials saved');
      refetch();
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="This deployment's IRD / CBMS credentials"
        description="The shared taxpayer login used to file subscription invoices (what this deployment charges each clinic) with IRD — separate from any clinic's own patient-billing credentials."
      />
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <Checkbox label="Enable IRD e-billing for subscription invoices" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <Badge tone={data.passwordConfigured ? 'success' : 'neutral'}>
            {data.passwordConfigured ? 'Configured' : 'Not configured'}
          </Badge>
        </div>
        {enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="IRD username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="Seller PAN" value={sellerPan} onChange={(e) => setSellerPan(e.target.value)} />
            <Input
              label="IRD password"
              type="password"
              placeholder={data.passwordConfigured ? '•••••••• (leave blank to keep)' : ''}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Seller display name"
              placeholder="Shown on records/print only — not sent to CBMS"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
            />
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>
            Save IRD settings
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
