import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
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
  const [busy, setBusy] = useState(false);
  const [planCode, setPlanCode] = useState('');
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('ACTIVE');
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
      () => platformApi.changeSubscription(organizationId, { planCode, status: subStatus, note: note || undefined }),
      'Subscription updated',
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ORG_STATUS_TONE[org.status]}>{ORG_STATUS_LABEL[org.status]}</Badge>
            {current && (
              <Badge tone={SUBSCRIPTION_STATUS_TONE[current.status]}>
                {current.plan.name} · {SUBSCRIPTION_STATUS_LABEL[current.status]}
              </Badge>
            )}
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
            </div>
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
