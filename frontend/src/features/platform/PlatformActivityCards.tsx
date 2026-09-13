import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import { ORG_STATUS_LABEL, ORG_STATUS_TONE, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from './types';
import type { IntegrationAdoption, RecentClinic, UpcomingRenewal } from './types';

function dt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function UpcomingRenewalsCard({ renewals }: { renewals: UpcomingRenewal[] }) {
  return (
    <Card>
      <div className="p-5 pb-0">
        <SectionHeader title="Renewals due soon" description="Next 30 days" />
      </div>
      {renewals.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">Nothing renewing in the next 30 days.</p>
      ) : (
        <ul className="divide-y divide-border">
          {renewals.map((r) => (
            <li key={r.organizationId} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{r.organizationName}</p>
                <p className="text-xs text-muted">
                  {r.planName} · due {dt(r.currentPeriodEnd)}
                </p>
              </div>
              <Badge tone={SUBSCRIPTION_STATUS_TONE[r.status]}>{SUBSCRIPTION_STATUS_LABEL[r.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AdoptionRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="px-5 py-3">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted">
          {count} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-muted">
        <div className="h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * How many clinics have moved off this deployment's shared eSewa/Khalti/IRD/Sparrow SMS credentials
 * onto their own account (Settings → Laboratory profile). A clinic not counted here is still fully
 * functional — it's simply using the shared fallback, which is fine for a small/early deployment.
 */
export function IntegrationAdoptionCard({ adoption }: { adoption: IntegrationAdoption }) {
  return (
    <Card>
      <div className="p-5 pb-0">
        <SectionHeader title="Integration adoption" description="Clinics using their own gateway credentials" />
      </div>
      {adoption.totalOrganizations === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">No clinics onboarded yet.</p>
      ) : (
        <div className="divide-y divide-border">
          <AdoptionRow label="Payment (eSewa / Khalti)" count={adoption.paymentConfigured} total={adoption.totalOrganizations} />
          <AdoptionRow label="IRD e-billing" count={adoption.irdConfigured} total={adoption.totalOrganizations} />
          <AdoptionRow label="SMS" count={adoption.smsConfigured} total={adoption.totalOrganizations} />
        </div>
      )}
    </Card>
  );
}

export function RecentClinicsCard({ clinics }: { clinics: RecentClinic[] }) {
  return (
    <Card>
      <div className="p-5 pb-0">
        <SectionHeader title="Recently onboarded" />
      </div>
      {clinics.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">No clinics onboarded yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {clinics.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.planName ?? '—'} · {dt(c.createdAt)}
                </p>
              </div>
              <Badge tone={ORG_STATUS_TONE[c.status]}>{ORG_STATUS_LABEL[c.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
