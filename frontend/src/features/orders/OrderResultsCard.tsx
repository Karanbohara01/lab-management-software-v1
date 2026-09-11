import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { RESULT_STATUS_LABEL, RESULT_STATUS_TONE, type ResultListItem } from '@/features/results/types';

export function OrderResultsCard({
  orderId,
  results,
  busyId,
  onVerify,
  onApprove,
}: {
  orderId: number;
  results: ResultListItem[];
  busyId: number | null;
  onVerify: (id: number) => void;
  onApprove: (id: number) => void;
}) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Results"
        description={`${results.filter((r) => r.status === 'APPROVED').length}/${results.length} authorized`}
      />
      <ul className="divide-y divide-border">
        {results.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
            <button
              type="button"
              onClick={() => navigate(`/app/results/${r.id}?from=order:${orderId}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <span className="font-medium text-foreground">{r.testName}</span>
              <span className="ml-2 font-mono text-xs text-muted">{r.testCode}</span>
              {r.hasCritical && <Badge tone="critical" >Critical</Badge>}
              {r.resultMode === 'CULTURE' && <Badge tone="info">Culture</Badge>}
            </button>
            <Badge tone={RESULT_STATUS_TONE[r.status]}>{RESULT_STATUS_LABEL[r.status]}</Badge>
            {r.status === 'PENDING' && hasPermission(PERMISSIONS.RESULT_ENTER) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/app/results/${r.id}?from=order:${orderId}`)}
              >
                Enter
              </Button>
            )}
            {r.status === 'ENTERED' && hasPermission(PERMISSIONS.RESULT_VERIFY) && (
              <Button size="sm" variant="secondary" loading={busyId === r.id} onClick={() => onVerify(r.id)}>
                Verify
              </Button>
            )}
            {r.status === 'VERIFIED' && hasPermission(PERMISSIONS.RESULT_APPROVE) && (
              <Button size="sm" loading={busyId === r.id} onClick={() => onApprove(r.id)}>
                Authorize
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
