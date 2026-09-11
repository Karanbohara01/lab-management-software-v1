import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, CheckCircle2, Clock, FileCheck, FlaskConical, Package, ScrollText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { SectionHeader } from './SectionHeader';
import type { DashboardSummary } from '../api';

type Severity = 'critical' | 'warning' | 'info';

interface ActionItem {
  key: string;
  severity: Severity;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  to: string;
  permission: string;
}

const SEVERITY_STYLE: Record<Severity, { dot: string; badge: string }> = {
  critical: { dot: 'bg-danger', badge: 'bg-danger/10 text-danger' },
  warning: { dot: 'bg-warning', badge: 'bg-warning/10 text-warning' },
  info: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary' },
};

/** "What should I do right now?" — a prioritised, actionable worklist derived from live counts. */
export function ActionCenter({
  summary,
  resultCounts,
}: {
  summary: DashboardSummary;
  resultCounts: Record<string, number>;
}) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const criticalPending = resultCounts.CRITICAL_PENDING ?? summary.unresolvedCriticalResults;
  const overdue = resultCounts.OVERDUE ?? 0;

  const items: ActionItem[] = [
    {
      key: 'critical',
      severity: 'critical',
      icon: AlertOctagon,
      title: 'Critical results awaiting acknowledgment',
      description: `${criticalPending} result${criticalPending === 1 ? '' : 's'} need a documented callback to the clinician.`,
      cta: 'Review critical results',
      to: '/app/results?criticalPendingOnly=true',
      permission: PERMISSIONS.RESULT_READ,
    },
    {
      key: 'verify',
      severity: 'warning',
      icon: FileCheck,
      title: 'Results awaiting verification',
      description: `${summary.resultsPendingVerification} result${summary.resultsPendingVerification === 1 ? '' : 's'} entered and ready for technician verification.`,
      cta: 'Review results',
      to: '/app/results?status=ENTERED',
      permission: PERMISSIONS.RESULT_VERIFY,
    },
    {
      key: 'approve',
      severity: 'info',
      icon: FileCheck,
      title: 'Reports awaiting pathologist authorization',
      description: `${summary.resultsPendingApproval} verified result${summary.resultsPendingApproval === 1 ? '' : 's'} ready for final sign-off.`,
      cta: 'Review & authorize',
      to: '/app/results?status=VERIFIED',
      permission: PERMISSIONS.RESULT_APPROVE,
    },
    {
      key: 'collect',
      severity: 'warning',
      icon: FlaskConical,
      title: 'Samples awaiting collection',
      description: `${summary.pendingCollection} sample${summary.pendingCollection === 1 ? '' : 's'} not yet collected from the patient.`,
      cta: 'View samples',
      to: '/app/samples?status=AWAITING_COLLECTION',
      permission: PERMISSIONS.SAMPLE_READ,
    },
    {
      key: 'overdue',
      severity: 'warning',
      icon: Clock,
      title: 'Results past their turnaround target',
      description: `${overdue} result${overdue === 1 ? '' : 's'} are running behind the expected turnaround time.`,
      cta: 'View overdue results',
      to: '/app/results?overdueOnly=true',
      permission: PERMISSIONS.RESULT_READ,
    },
    {
      key: 'ird',
      severity: 'critical',
      icon: ScrollText,
      title: 'Failed IRD e-billing submissions',
      description: `${summary.failedIrdSubmissions} submission${summary.failedIrdSubmissions === 1 ? '' : 's'} failed and need to be retried or filed manually.`,
      cta: 'Review submissions',
      to: '/app/ird?status=FAILED',
      permission: PERMISSIONS.IRD_SUBMISSION_READ,
    },
    {
      key: 'inventory',
      severity: 'warning',
      icon: Package,
      title: 'Inventory needs attention',
      description: `${summary.inventoryAlerts} item${summary.inventoryAlerts === 1 ? '' : 's'} are low, expiring soon, or out of stock.`,
      cta: 'View inventory',
      to: '/app/inventory',
      permission: PERMISSIONS.INVENTORY_READ,
    },
  ];

  const counts: Record<string, number> = {
    critical: criticalPending,
    verify: summary.resultsPendingVerification,
    approve: summary.resultsPendingApproval,
    collect: summary.pendingCollection,
    overdue,
    ird: summary.failedIrdSubmissions,
    inventory: summary.inventoryAlerts,
  };

  const severityRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  const visible = items
    .filter((it) => hasPermission(it.permission) && (counts[it.key] ?? 0) > 0)
    .sort(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] || (counts[b.key] ?? 0) - (counts[a.key] ?? 0),
    );

  return (
    <Card className="mb-5">
      <div className="px-5 pt-5">
        <SectionHeader title="Attention required" description="Prioritised across your entire laboratory." />
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center gap-3 px-5 pb-5 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
          Nothing needs attention right now — the laboratory is caught up.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((it) => (
            <li key={it.key} className="flex items-center gap-3 px-5 py-3">
              <span
                className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', SEVERITY_STYLE[it.severity].badge)}
              >
                <it.icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', SEVERITY_STYLE[it.severity].dot)} aria-hidden />
                  {it.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">{it.description}</p>
              </div>
              <Button size="sm" variant="secondary" className="shrink-0" onClick={() => navigate(it.to)}>
                {it.cta}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
