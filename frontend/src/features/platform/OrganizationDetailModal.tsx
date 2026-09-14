import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { platformApi } from './api';
import {
  ORG_STATUS_LABEL,
  ORG_STATUS_TONE,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_TONE,
  type OrganizationStatus,
  type Plan,
  type SubscriptionStatus,
} from './types';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

const ORG_STATUSES: OrganizationStatus[] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'];
const SUB_STATUSES: SubscriptionStatus[] = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'];

export function OrganizationDetailModal({
  open,
  onClose,
  organizationId,
  plans,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: number | null;
  plans: Plan[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [planCode, setPlanCode] = useState('');
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [periodEnd, setPeriodEnd] = useState('');
  const [note, setNote] = useState('');

  const { data: org, loading, error, refetch } = useQuery(
    () => (organizationId ? platformApi.organization(organizationId) : Promise.resolve(null)),
    [organizationId],
  );

  const current = org?.subscriptionHistory[0] ?? null;

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      refetch();
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const applySubscriptionChange = () => {
    if (!organizationId || !planCode) return;
    act(
      () =>
        platformApi.changeSubscription(organizationId, {
          planCode,
          status: subStatus,
          currentPeriodEnd: periodEnd ? new Date(periodEnd).toISOString() : undefined,
          note: note || undefined,
        }),
      'Subscription updated',
    );
  };

  const startBillingToday = () => {
    if (!organizationId || !current) return;
    act(
      () =>
        platformApi.changeSubscription(organizationId, {
          planCode: current.plan.code,
          status: 'ACTIVE',
          currentPeriodEnd: new Date().toISOString(),
          note: 'Billing period started by platform admin',
        }),
      'Billing period started — the next sweep will issue an invoice',
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={org?.name ?? 'Clinic'} description={org ? `/${org.slug}` : undefined} size="lg">
      {loading && !org ? (
        <LoadingState label="Loading clinic…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : org ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ORG_STATUS_TONE[org.status]}>{ORG_STATUS_LABEL[org.status]}</Badge>
              {current && (
                <Badge tone={SUBSCRIPTION_STATUS_TONE[current.status]}>
                  {current.plan.name} · {SUBSCRIPTION_STATUS_LABEL[current.status]}
                </Badge>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/app/platform/billing?orgId=${org.id}`);
              }}
            >
              <Receipt className="h-3.5 w-3.5" aria-hidden />
              View billing
            </Button>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Row label="Contact" value={org.contactName} />
            <Row label="Email" value={org.contactEmail} />
            <Row label="Phone" value={org.contactPhone} />
            <Row label="City" value={org.city} />
            <Row label="PAN" value={org.pan} />
            <Row label="Onboarded" value={dt(org.createdAt)} />
          </div>
          {org.notes && <p className="rounded-md bg-surface-muted p-3 text-sm text-muted">{org.notes}</p>}

          {current && !current.currentPeriodEnd && (
            <Alert tone="warning">
              This clinic's billing period has never been started — no subscription invoice will ever be
              issued until one is. Onboarding via the admin dashboard deliberately leaves this open-ended
              (for negotiated/sales-assisted signups); set a period end below, or use the quick action.
              <div className="mt-2">
                <Button size="sm" disabled={busy} onClick={startBillingToday}>
                  Start billing today
                </Button>
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <span className="w-full text-xs font-medium uppercase tracking-wide text-muted">Clinic status</span>
            {ORG_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === org.status ? 'primary' : 'secondary'}
                disabled={busy || s === org.status}
                onClick={() => act(() => platformApi.changeStatus(org.id, s), `Clinic marked ${ORG_STATUS_LABEL[s]}`)}
              >
                {ORG_STATUS_LABEL[s]}
              </Button>
            ))}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Change subscription</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Plan"
                value={planCode || current?.plan.code || ''}
                onChange={(e) => setPlanCode(e.target.value)}
                options={plans.map((p) => ({ value: p.code, label: `${p.name} — NPR ${p.priceMonthly}/mo` }))}
              />
              <Select
                label="Status"
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value as SubscriptionStatus)}
                options={SUB_STATUSES.map((s) => ({ value: s, label: SUBSCRIPTION_STATUS_LABEL[s] }))}
              />
              <Input
                label="Current billing period ends"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted">
              {current?.currentPeriodEnd
                ? `Currently billed through ${dt(current.currentPeriodEnd)}. Leave blank to keep it unchanged.`
                : 'No billing period is set — this clinic will never be auto-invoiced until one is.'}
            </p>
            <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button
                variant="danger"
                disabled={busy || !current}
                onClick={() => act(() => platformApi.cancelSubscription(org.id, note || 'Cancelled by platform admin'), 'Subscription cancelled')}
              >
                Cancel subscription
              </Button>
              <Button disabled={busy} onClick={applySubscriptionChange}>
                Apply
              </Button>
            </div>
          </div>

          {org.subscriptionHistory.length > 0 && (
            <div className="border-t border-border pt-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">History</span>
              <ul className="mt-2 divide-y divide-border text-sm">
                {org.subscriptionHistory.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <span>
                      {s.plan.name} · {dt(s.startedAt)}
                      {s.currentPeriodEnd ? ` → ${dt(s.currentPeriodEnd)}` : ''}
                    </span>
                    <Badge tone={SUBSCRIPTION_STATUS_TONE[s.status]}>{SUBSCRIPTION_STATUS_LABEL[s.status]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-foreground">{value ?? '—'}</span>
    </div>
  );
}
