import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { SectionHeader } from './SectionHeader';
import type { DashboardSummary } from '../api';

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
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const stages = ([
    { key: 'patients', label: 'Registered', value: summary.todayPatients, to: '/app/patients', permission: PERMISSIONS.PATIENT_READ },
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
      label: 'Authorization',
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
        <ol className="flex min-w-max items-stretch gap-0 px-1">
          {stages.map((s, i) => (
            <li key={s.key} className="flex items-stretch">
              <button
                type="button"
                onClick={() => navigate(s.to)}
                className={cn(
                  'flex w-32 flex-col justify-between rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-surface-muted',
                  s.tone === 'warning' ? 'border-warning/30' : 'border-border',
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{s.label}</span>
                <span className={cn('mt-1.5 text-xl font-semibold', s.tone === 'warning' ? 'text-warning' : 'text-foreground')}>
                  {s.value}
                </span>
              </button>
              {i < stages.length - 1 && (
                <span className="flex items-center px-1 text-border" aria-hidden>
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
