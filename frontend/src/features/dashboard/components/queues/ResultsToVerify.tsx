import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { ApiError } from '@/types/api';
import { resultsApi } from '@/features/results/api';
import { verifyWithPrompts } from '@/features/results/overrides';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useNavigateFrom } from '@/lib/navigation';
import { QueueShell } from './QueueShell';
import { useT } from '@/i18n';

/** Bench worklist: entered results ready for a second-check verification. */
export function ResultsToVerify() {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const t = useT();
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useQuery(() => resultsApi.list({ status: 'ENTERED', size: 8 }), []);

  const verify = async (id: number) => {
    setBusyId(id);
    try {
      const outcome = await verifyWithPrompts(id, {
        incomplete: t('Enter a documented reason to verify this result as partial:'),
        other: t('Enter a documented reason to verify it yourself:'),
      });
      if (outcome.ok) {
        toast.success(outcome.overridden ? t('Result verified with override') : t('Result verified'));
        refetch();
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('Unable to verify'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <QueueShell
      title="Results to verify"
      description="Entered values ready for technician sign-off."
      count={data?.totalElements}
      viewAllTo="/app/results?status=ENTERED"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="Nothing is waiting on verification."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/results/${r.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {r.testName}
                {r.hasCritical && <Badge tone="critical">{t('Critical')}</Badge>}
                {r.hasAbnormal && !r.hasCritical && <Badge tone="warning">{t('Abnormal')}</Badge>}
                {!r.complete && r.resultMode !== 'CULTURE' && <Badge tone="warning">{t('Incomplete')}</Badge>}
              </p>
              <p className="truncate text-xs text-muted">
                {r.patientName} <span className="font-mono">{r.patientMrn}</span> · {r.departmentName}
              </p>
            </button>
            {hasPermission(PERMISSIONS.RESULT_VERIFY) && (
              <Button size="sm" variant="secondary" loading={busyId === r.id} onClick={() => verify(r.id)}>
                {t('Verify')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
