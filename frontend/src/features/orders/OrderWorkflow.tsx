import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { translate, getLocale, useT } from '@/i18n';
import type { SampleListItem } from '@/features/samples/types';
import type { ResultListItem } from '@/features/results/types';
import type { ReportStatus } from '@/features/reports/types';
import type { OrderDetail } from './types';

const STEPS = ['Draft', 'Confirmed', 'Collection', 'In lab', 'Results', 'Approved', 'Report', 'Delivered'];

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
  // A plain function, called outside any component — no hook access, so translate() is called
  // directly against the current locale rather than through useT().
  const tr = (key: string, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

  if (order.status === 'CANCELLED') return { index: -1, next: null, note: tr('Order cancelled.') };
  if (order.status === 'DRAFT')
    return {
      index: 0,
      next: { action: 'confirm', label: tr('Confirm order'), permission: PERMISSIONS.LAB_ORDER_WRITE },
      note: tr('Confirm to lock the order and generate samples.'),
    };

  const active = samples.filter((s) => s.status !== 'REJECTED');
  if (active.length === 0) return { index: 1, next: null, note: tr('Generating samples…') };

  if (active.some((s) => s.status === 'AWAITING_COLLECTION'))
    return {
      index: 2,
      next: { action: 'collect', label: tr('Collect samples'), permission: PERMISSIONS.SAMPLE_COLLECT },
    };
  if (active.some((s) => s.status === 'COLLECTED'))
    return {
      index: 2,
      next: { action: 'receive', label: tr('Receive into lab'), permission: PERMISSIONS.SAMPLE_RECEIVE },
    };

  // all active samples received
  if (results.length === 0) return { index: 3, next: null, note: tr('Opening result worklist…') };
  const count = (s: ResultListItem['status']) => results.filter((r) => r.status === s).length;

  if (count('PENDING') > 0)
    return {
      index: 4,
      next: {
        action: 'enter',
        label: tr('Enter results ({count} pending)', { count: count('PENDING') }),
        permission: PERMISSIONS.RESULT_ENTER,
      },
    };
  if (count('ENTERED') > 0)
    return {
      index: 4,
      next: {
        action: 'verify',
        label: tr('Verify results ({count})', { count: count('ENTERED') }),
        permission: PERMISSIONS.RESULT_VERIFY,
      },
    };
  if (count('VERIFIED') > 0)
    return {
      index: 4,
      next: {
        action: 'approve',
        label: tr('Approve results ({count})', { count: count('VERIFIED') }),
        permission: PERMISSIONS.RESULT_APPROVE,
      },
    };

  // all results approved
  if (!report)
    return {
      index: 5,
      next: { action: 'report', label: tr('Generate report'), permission: PERMISSIONS.REPORT_GENERATE },
    };
  if (report.status === 'GENERATED')
    return {
      index: 6,
      next: {
        action: 'release',
        label: tr('Sign & release report'),
        permission: PERMISSIONS.REPORT_GENERATE,
      },
    };
  if (report.status === 'RELEASED')
    return {
      index: 6,
      next: { action: 'deliver', label: tr('Deliver report'), permission: PERMISSIONS.REPORT_DELIVER },
    };
  return { index: 7, next: null, note: tr('Report delivered — this order is complete.') };
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
  const t = useT();
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
                {t(label)}
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
            <span className="text-muted">{t('Next step:')} </span>
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
