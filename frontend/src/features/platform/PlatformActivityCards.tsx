import { Clock, Sparkles, Plug } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AnimatedNumber,
  SPRING_SMOOTH,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import { ORG_STATUS_LABEL, ORG_STATUS_TONE, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from './types';
import type { IntegrationAdoption, RecentClinic, UpcomingRenewal } from './types';

function dt(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[getLocale()], { dateStyle: 'medium' });
}

function ClinicAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initial}
    </span>
  );
}

export function UpcomingRenewalsCard({ renewals }: { renewals: UpcomingRenewal[] }) {
  const t = useT();
  const skipMotion = isTestEnv();
  return (
    <Card>
      <div className="p-5 pb-0">
        <SectionHeader icon={Clock} title={t('Renewals due soon')} description={t('Next 30 days')} />
      </div>
      {renewals.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">{t('Nothing renewing in the next 30 days.')}</p>
      ) : (
        <motion.ul
          variants={staggerContainerVariants}
          initial={skipMotion ? false : 'hidden'}
          animate="show"
          className="divide-y divide-border"
        >
          {renewals.map((r) => (
            <motion.li key={r.organizationId} variants={staggerItemVariants} className="flex items-center gap-3 px-5 py-3">
              <ClinicAvatar name={r.organizationName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.organizationName}</p>
                <p className="truncate text-xs text-muted">
                  {t('{plan} · due {date}', { plan: r.planName, date: dt(r.currentPeriodEnd) })}
                </p>
              </div>
              <Badge tone={SUBSCRIPTION_STATUS_TONE[r.status]}>{t(SUBSCRIPTION_STATUS_LABEL[r.status])}</Badge>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  );
}

function AdoptionRow({ label, count, total }: { label: string; count: number; total: number }) {
  const skipMotion = isTestEnv();
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="px-5 py-3">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted">
          <AnimatedNumber value={count} className="font-medium text-foreground" /> / {total} (
          <AnimatedNumber value={pct} format={(n) => `${Math.round(n)}%`} />)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <motion.div
          className="h-2 rounded-full bg-primary"
          initial={skipMotion ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={SPRING_SMOOTH}
        />
      </div>
    </div>
  );
}

export function IntegrationAdoptionCard({ adoption }: { adoption: IntegrationAdoption }) {
  const t = useT();
  return (
    <Card>
      <div className="p-5 pb-0">
        <SectionHeader icon={Plug} title={t('Integration adoption')} description={t('Clinics using their own gateway credentials')} />
      </div>
      {adoption.totalOrganizations === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">{t('No clinics onboarded yet.')}</p>
      ) : (
        <div className="divide-y divide-border">
          <AdoptionRow label={t('Payment (eSewa / Khalti)')} count={adoption.paymentConfigured} total={adoption.totalOrganizations} />
          <AdoptionRow label={t('IRD e-billing')} count={adoption.irdConfigured} total={adoption.totalOrganizations} />
          <AdoptionRow label={t('SMS')} count={adoption.smsConfigured} total={adoption.totalOrganizations} />
        </div>
      )}
    </Card>
  );
}

export function RecentClinicsCard({ clinics }: { clinics: RecentClinic[] }) {
  const t = useT();
  const skipMotion = isTestEnv();
  return (
    <Card>
      <div className="p-5 pb-0">
        <SectionHeader icon={Sparkles} title={t('Recently onboarded')} />
      </div>
      {clinics.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">{t('No clinics onboarded yet.')}</p>
      ) : (
        <motion.ul
          variants={staggerContainerVariants}
          initial={skipMotion ? false : 'hidden'}
          animate="show"
          className="divide-y divide-border"
        >
          {clinics.map((c) => (
            <motion.li key={c.id} variants={staggerItemVariants} className="flex items-center gap-3 px-5 py-3">
              <ClinicAvatar name={c.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {c.planName ?? '—'} · {dt(c.createdAt)}
                </p>
              </div>
              <Badge tone={ORG_STATUS_TONE[c.status]}>{t(ORG_STATUS_LABEL[c.status])}</Badge>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  );
}
