import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { SectionHeader } from './SectionHeader';
import type { DashboardSummary } from '../api';
import { useNavigateFrom } from '@/lib/navigation';
import { useT } from '@/i18n';

interface Stage {
  key: string;
  label: string;
  value: number;
  to: string;
  permission: string;
  tone?: 'warning';
}

/** Horizontal pipeline showing where today's work currently sits, end to end. */
export function WorkflowPipeline({
  summary,
  samplesCounts,
  resultCounts,
}: {
  summary: DashboardSummary;
  samplesCounts: Record<string, number>;
  resultCounts: Record<string, number>;
}) {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const t = useT();
  const skipMotion = isTestEnv();

  const stages = ([
    { key: 'patients', label: 'Patients registered', value: summary.todayPatients, to: '/app/patients', permission: PERMISSIONS.PATIENT_READ },
    { key: 'orders', label: 'Ordered', value: summary.todayOrders, to: '/app/orders', permission: PERMISSIONS.LAB_ORDER_READ },
    {
      key: 'collection',
      label: 'Awaiting collection',
      value: samplesCounts.AWAITING_COLLECTION ?? summary.pendingCollection,
      to: '/app/samples?status=AWAITING_COLLECTION',
      permission: PERMISSIONS.SAMPLE_READ,
      tone: (samplesCounts.AWAITING_COLLECTION ?? summary.pendingCollection) > 0 ? 'warning' : undefined,
    },
    {
      key: 'lab',
      label: 'In the lab',
      value: summary.samplesInLab,
      to: '/app/samples?status=RECEIVED',
      permission: PERMISSIONS.SAMPLE_READ,
    },
    {
      key: 'entry',
      label: 'Result entry',
      value: resultCounts.PENDING ?? summary.resultsPendingEntry,
      to: '/app/results?status=PENDING',
      permission: PERMISSIONS.RESULT_READ,
      tone: (resultCounts.PENDING ?? summary.resultsPendingEntry) > 0 ? 'warning' : undefined,
    },
    {
      key: 'verify',
      label: 'Verification',
      value: resultCounts.ENTERED ?? summary.resultsPendingVerification,
      to: '/app/results?status=ENTERED',
      permission: PERMISSIONS.RESULT_READ,
    },
    {
      key: 'approve',
      label: 'Result approval',
      value: resultCounts.VERIFIED ?? summary.resultsPendingApproval,
      to: '/app/results?status=VERIFIED',
      permission: PERMISSIONS.RESULT_READ,
    },
    { key: 'reports', label: 'Reported', value: summary.reportsToday, to: '/app/reports', permission: PERMISSIONS.REPORT_READ },
  ] as Stage[]).filter((s) => hasPermission(s.permission));

  return (
    <Card className="mb-5 p-5">
      <SectionHeader title="Laboratory pipeline" description="Where today's work currently stands, end to end." />
      <div className="-mx-1 overflow-x-auto pb-1">
        <motion.ol
          variants={staggerContainerVariants}
          initial={skipMotion ? false : 'hidden'}
          animate="show"
          className="flex items-stretch gap-0 px-1"
        >
          {stages.map((s, i) => (
            <motion.li
              key={s.key}
              variants={staggerItemVariants}
              className="flex flex-1 items-stretch"
            >
              <motion.button
                whileHover={skipMotion ? undefined : { y: -2 }}
                whileTap={skipMotion ? undefined : { scale: 0.985 }}
                transition={SPRING_SNAPPY}
                type="button"
                onClick={() => navigate(s.to)}
                className={cn(
                  'flex min-w-[100px] flex-1 flex-col justify-between rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-surface-muted',
                  s.tone === 'warning' ? 'border-warning/30' : 'border-border',
                )}
              >
                <span className="text-label uppercase text-muted">{t(s.label)}</span>
                <span
                  className={cn(
                    'mt-1.5 text-xl font-semibold tracking-tight tabular-nums',
                    s.tone === 'warning' ? 'text-warning' : 'text-foreground',
                  )}
                >
                  <AnimatedNumber value={s.value} />
                </span>
              </motion.button>
              {i < stages.length - 1 && (
                <span className="flex items-center px-1 text-border" aria-hidden>
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Card>
  );
}
