import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { settingsApi, type LaboratoryProfile } from './api';

const MAX_LOGO_BYTES = 400_000;

export function LaboratorySettingsPage() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.SETTINGS_WRITE);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, loading, error, refetch } = useQuery(() => settingsApi.getLaboratory(), []);
  const [form, setForm] = useState<LaboratoryProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (loading && !form) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!form) return null;

  const set = <K extends keyof LaboratoryProfile>(key: K, value: LaboratoryProfile[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const onLogo = (file: File) => {
    if (file.size > MAX_LOGO_BYTES) {
      setFormError('Logo must be under 400 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logoDataUri', String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await settingsApi.updateLaboratory({ ...form, name: form.name.trim() });
      toast.success('Laboratory profile saved');
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Laboratory profile"
        description="Identity and letterhead used on generated reports."
        actions={
          canWrite ? (
            <Button onClick={save} loading={saving}>
              Save profile
            </Button>
          ) : undefined
        }
      />

      {formError && (
        <div className="mb-4">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}
      {!canWrite && (
        <div className="mb-4">
          <Alert tone="info">You have read-only access to settings.</Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Report letterhead" />
            <CardBody className="space-y-4">
              <Input label="Laboratory name" value={form.name} disabled={!canWrite} onChange={(e) => set('name', e.target.value)} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Input label="Address" value={form.addressLine ?? ''} disabled={!canWrite} onChange={(e) => set('addressLine', e.target.value)} />
                <Input label="City" value={form.city ?? ''} disabled={!canWrite} onChange={(e) => set('city', e.target.value)} />
                <Input label="PAN / VAT number" value={form.panNumber ?? ''} disabled={!canWrite} onChange={(e) => set('panNumber', e.target.value)} />
                <Input label="Phone" value={form.phone ?? ''} disabled={!canWrite} onChange={(e) => set('phone', e.target.value)} />
                <Input label="Email" type="email" value={form.email ?? ''} disabled={!canWrite} onChange={(e) => set('email', e.target.value)} />
              </div>
              <Textarea
                label="Report footer / disclaimer"
                value={form.reportFooter ?? ''}
                disabled={!canWrite}
                onChange={(e) => set('reportFooter', e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Billing" />
            <CardBody className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Input
                  label="Fiscal year"
                  hint="e.g. 2082/83"
                  value={form.fiscalYear}
                  disabled={!canWrite}
                  onChange={(e) => set('fiscalYear', e.target.value)}
                />
                <Input
                  label="Invoice prefix"
                  value={form.invoicePrefix}
                  disabled={!canWrite}
                  onChange={(e) => set('invoicePrefix', e.target.value)}
                />
                <Input
                  label="Default tax rate %"
                  type="number"
                  step="any"
                  min={0}
                  value={form.defaultTaxRate}
                  disabled={!canWrite}
                  onChange={(e) => set('defaultTaxRate', Number(e.target.value) || 0)}
                />
                <Input
                  label="Expiry alert (days)"
                  type="number"
                  min={1}
                  hint="Flag stock expiring within this many days"
                  value={form.inventoryExpiryAlertDays}
                  disabled={!canWrite}
                  onChange={(e) => set('inventoryExpiryAlertDays', Number(e.target.value) || 30)}
                />
              </div>
              <p className="text-xs text-muted">
                Invoice numbers are issued per fiscal year as{' '}
                <code className="font-mono">
                  {form.invoicePrefix}-{form.fiscalYear}-000001
                </code>
                . Change the fiscal year when the new year begins.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Operations" />
            <CardBody>
              <Checkbox
                label="Require payment before sample collection"
                hint="Self-pay patients must have their order paid in full before a sample can be collected — collectors can still override with a documented reason. Insurance / SSF / corporate patients are always exempt (billed on account)."
                checked={form.requirePaymentBeforeCollection}
                disabled={!canWrite}
                onChange={(e) => set('requirePaymentBeforeCollection', e.target.checked)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Logo" />
            <CardBody className="space-y-3">
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-border bg-surface-muted">
                {form.logoDataUri ? (
                  <img src={form.logoDataUri} alt="Current logo" className="max-h-24 max-w-[80%] object-contain" />
                ) : (
                  <span className="text-sm text-muted">No logo</span>
                )}
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
                  />
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>
                    Upload
                  </Button>
                  {form.logoDataUri && (
                    <Button variant="ghost" size="sm" onClick={() => set('logoDataUri', null)}>
                      Remove
                    </Button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted">PNG, JPEG or SVG, under 400 KB. Shown on generated report letterheads.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Letterhead preview" />
            <CardBody className="space-y-1 text-sm">
              {form.logoDataUri && (
                <img src={form.logoDataUri} alt="" className="mb-2 h-10 max-w-[60%] object-contain" />
              )}
              <p className="font-semibold text-foreground">{form.name || 'Laboratory name'}</p>
              <p className="text-muted">{[form.addressLine, form.city].filter(Boolean).join(', ') || '—'}</p>
              <p className="text-muted">{[form.phone, form.email].filter(Boolean).join(' · ') || '—'}</p>
              {form.panNumber && <p className="text-muted">PAN: {form.panNumber}</p>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
