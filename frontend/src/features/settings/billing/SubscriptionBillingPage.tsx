import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { signupApi } from '@/features/signup/api';
import { subscriptionBillingApi, submitEsewaForm } from './api';
import { SUBSCRIPTION_INVOICE_STATUS_LABEL, SUBSCRIPTION_INVOICE_STATUS_TONE } from './types';

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  TRIALING: 'Trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
};
const SUBSCRIPTION_STATUS_TONE: Record<string, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  TRIALING: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  SUSPENDED: 'danger',
  CANCELLED: 'neutral',
};

/**
 * Current plan + a picker to request a change. Never applies immediately — the backend queues it
 * for the next billing-period rollover, so switching plans is deliberately simple (no mid-period
 * proration) rather than risky. See SubscriptionBillingService.requestPlanChange's javadoc.
 */
function PlanCard({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const { data: sub, loading, error, refetch } = useQuery(() => subscriptionBillingApi.mySubscription(), []);
  const { data: plans } = useQuery(() => signupApi.plans(), []);
  const [changing, setChanging] = useState<string | null>(null);

  if (loading && !sub) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!sub) return null;

  const requestChange = async (planCode: string) => {
    setChanging(planCode);
    try {
      await subscriptionBillingApi.changePlan(planCode);
      toast.success(
        planCode === sub.planCode
          ? 'Scheduled plan change cancelled.'
          : 'Plan change scheduled — it takes effect at the start of your next billing period.',
      );
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to change plan');
    } finally {
      setChanging(null);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Plan"
        description="Changing plans takes effect at the start of your next billing period — no mid-period charge or credit."
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {sub.planName} · NPR {sub.priceMonthly.toLocaleString()}/mo
            </p>
            <p className="text-xs text-muted">
              Up to {sub.maxUsers} users, {sub.maxBranches} branch(es)
              {sub.currentPeriodEnd && ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
            </p>
          </div>
          <Badge tone={SUBSCRIPTION_STATUS_TONE[sub.status] ?? 'neutral'}>
            {SUBSCRIPTION_STATUS_LABEL[sub.status] ?? sub.status}
          </Badge>
        </div>

        {sub.pendingPlanName && (
          <Alert tone="info">
            Switching to <strong>{sub.pendingPlanName}</strong> at the start of your next billing period.
            {canWrite && (
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => requestChange(sub.planCode)} loading={changing === sub.planCode}>
                Cancel
              </Button>
            )}
          </Alert>
        )}

        {canWrite && plans && plans.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.code === sub.planCode;
              const isPending = plan.code === sub.pendingPlanCode;
              return (
                <button
                  key={plan.code}
                  type="button"
                  disabled={isCurrent || changing !== null}
                  onClick={() => requestChange(plan.code)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-default ${
                    isCurrent || isPending ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{plan.name}</span>
                    {(isCurrent || isPending) && <Check className="h-4 w-4 text-primary" aria-hidden />}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    NPR {plan.priceMonthly.toLocaleString()}/mo · up to {plan.maxUsers} users
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {isCurrent ? 'Current plan' : isPending ? 'Scheduled' : 'Switch to this plan'}
                  </p>
                </button>
              );
            })}
          </div>
        )}
        {!canWrite && <Alert tone="info">You have read-only access to billing.</Alert>}
      </CardBody>
    </Card>
  );
}

function dt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/**
 * This clinic's own subscription-billing history — what it owes THIS deployment, never to be
 * confused with the ordinary patient-facing Invoices screen. A clinic pays via this deployment's
 * own eSewa merchant account (never its own patient-facing one — see the backend's
 * PlatformEsewaClient javadoc for why that distinction matters).
 */
export function SubscriptionBillingPage() {
  const { invoiceId } = useParams<{ invoiceId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.SETTINGS_WRITE);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { data, loading, error, refetch } = useQuery(() => subscriptionBillingApi.invoices(), []);

  // Returned from eSewa's hosted checkout — always re-verify server-to-server before trusting anything.
  useEffect(() => {
    if (!invoiceId || !searchParams.get('gatewayResult')) return;
    setVerifying(true);
    subscriptionBillingApi
      .verify(Number(invoiceId))
      .then((inv) => {
        if (inv.status === 'PAID') {
          toast.success(`Payment confirmed for ${inv.invoiceNumber}`);
        } else {
          toast.error('Payment could not be confirmed. If you completed checkout, it may take a moment — refresh shortly.');
        }
        refetch();
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Unable to verify payment'))
      .finally(() => {
        setVerifying(false);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('gatewayResult');
          return next;
        }, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const pay = async (id: number) => {
    setPayingId(id);
    try {
      const result = await subscriptionBillingApi.pay(id);
      if (result.success && result.formAction && result.formFields) {
        submitEsewaForm(result.formAction, result.formFields);
        // page navigates away — no need to reset payingId
      } else {
        toast.error(result.errorMessage ?? 'Unable to start checkout');
        setPayingId(null);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to start checkout');
      setPayingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Subscription & billing"
        description="Invoices for this clinic's own LIMS subscription."
      />

      {verifying && (
        <div className="mb-4">
          <Alert tone="info">Confirming your payment…</Alert>
        </div>
      )}

      <div className="mb-4">
        <PlanCard canWrite={canWrite} />
      </div>

      <Card>
        <CardHeader title="Invoices" />
        <CardBody className="p-0">
          {loading && !data ? (
            <div className="p-6">
              <LoadingState />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={refetch} />
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No invoices yet" message="Your first subscription invoice will appear here once issued." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.content.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {inv.invoiceNumber} · {inv.planName}
                    </p>
                    <p className="text-xs text-muted">
                      {dt(inv.periodStart)} – {dt(inv.periodEnd)} · due {dt(inv.dueAt)} · NPR {inv.amount.toLocaleString()}
                    </p>
                    {inv.status === 'PAID' && inv.paidAt && (
                      <p className="text-xs text-muted">Paid {dt(inv.paidAt)}{inv.paymentReference ? ` · ${inv.paymentReference}` : ''}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={SUBSCRIPTION_INVOICE_STATUS_TONE[inv.status]}>
                      {SUBSCRIPTION_INVOICE_STATUS_LABEL[inv.status]}
                    </Badge>
                    {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && canWrite && (
                      <Button size="sm" onClick={() => pay(inv.id)} loading={payingId === inv.id}>
                        Pay now
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
