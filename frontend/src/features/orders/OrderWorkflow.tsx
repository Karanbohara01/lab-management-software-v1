import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import type { SampleListItem } from '@/features/samples/types';
import type { ResultListItem } from '@/features/results/types';
import type { ReportStatus } from '@/features/reports/types';
import type { OrderDetail } from './types';

const STEPS = ['Draft', 'Confirmed', 'Collection', 'In lab', 'Results', 'Authorized', 'Report', 'Delivered'];

export type WorkflowAction =
  | 'confirm'
  | 'collect'
  | 'receive'
  | 'enter'
  | 'verify'
  | 'approve'
  | 'report'
  | 'release'
  | 'deliver';

interface NextStep {
  action: WorkflowAction;
  label: string;
  permission: string;
  hint?: string;
}

interface Stage {
  index: number;
  next: NextStep | null;
  note?: string;
}

export function computeStage(
  order: OrderDetail,
  samples: SampleListItem[],
  results: ResultListItem[],
  report: { status: ReportStatus } | null,
): Stage {
  if (order.status === 'CANCELLED') return { index: -1, next: null, note: 'Order cancelled.' };
  if (order.status === 'DRAFT')
    return {
      index: 0,
      next: { action: 'confirm', label: 'Confirm order', permission: PERMISSIONS.LAB_ORDER_WRITE },
      note: 'Confirm to lock the order and generate samples.',
    };

  const active = samples.filter((s) => s.status !== 'REJECTED');
  if (active.length === 0) return { index: 1, next: null, note: 'Generating samples…' };

  if (active.some((s) => s.status === 'AWAITING_COLLECTION'))
    return {
      index: 2,
      next: { action: 'collect', label: 'Collect samples', permission: PERMISSIONS.SAMPLE_COLLECT },
    };
  if (active.some((s) => s.status === 'COLLECTED'))
    return {
      index: 2,
      next: { action: 'receive', label: 'Receive into lab', permission: PERMISSIONS.SAMPLE_RECEIVE },
    };

  // all active samples received
  if (results.length === 0) return { index: 3, next: null, note: 'Opening result worklist…' };
  const count = (s: ResultListItem['status']) => results.filter((r) => r.status === s).length;

  if (count('PENDING') > 0)
    return {
      index: 4,
      next: {
        action: 'enter',
        label: `Enter results (${count('PENDING')} pending)`,
        permission: PERMISSIONS.RESULT_ENTER,
      },
    };
  if (count('ENTERED') > 0)
    return {
      index: 4,
      next: {
        action: 'verify',
        label: `Verify results (${count('ENTERED')})`,
        permission: PERMISSIONS.RESULT_VERIFY,
      },
    };
  if (count('VERIFIED') > 0)
    return {
      index: 4,
      next: {
        action: 'approve',
        label: `Authorize results (${count('VERIFIED')})`,
        permission: PERMISSIONS.RESULT_APPROVE,
      },
    };

  // all results approved
  if (!report)
    return {
      index: 5,
      next: { action: 'report', label: 'Generate report', permission: PERMISSIONS.REPORT_GENERATE },
    };
  if (report.status === 'GENERATED')
    return {
      index: 6,
      next: {
        action: 'release',
        label: 'Sign & release report',
        permission: PERMISSIONS.REPORT_GENERATE,
      },
    };
  if (report.status === 'RELEASED')
    return {
      index: 6,
      next: { action: 'deliver', label: 'Deliver report', permission: PERMISSIONS.REPORT_DELIVER },
    };
  return { index: 7, next: null, note: 'Report delivered — this order is complete.' };
}

export function OrderWorkflow({
  stage,
  busy,
  onAction,
}: {
  stage: Stage;
  busy: boolean;
  onAction: (a: WorkflowAction) => void;
}) {
  const { hasPermission } = useAuth();
  const cancelled = stage.index === -1;

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface p-4">
      <ol className="flex flex-wrap items-center gap-y-2">
        {STEPS.map((label, i) => {
          const done = !cancelled && i < stage.index;
          const current = !cancelled && i === stage.index;
          return (
            <li key={label} className="flex items-center">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-primary bg-primary text-primary-foreground',
                  current && 'border-primary text-primary',
                  !done && !current && 'border-border text-muted',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  current ? 'font-semibold text-foreground' : 'text-muted',
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      {(stage.next || stage.note) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="text-sm">
            <span className="text-muted">Next step: </span>
            <span className="font-medium text-foreground">
              {stage.next ? stage.next.label : stage.note}
            </span>
            {stage.next && stage.note && <span className="ml-2 text-xs text-muted">{stage.note}</span>}
          </div>
          {stage.next && hasPermission(stage.next.permission) && (
            <Button size="sm" loading={busy} onClick={() => onAction(stage.next!.action)}>
              {stage.next.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
