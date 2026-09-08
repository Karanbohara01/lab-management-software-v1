import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatDate } from './format';
import { reportsApi } from '@/features/reports/api';
import { REPORT_STATUS_TONE, type ReportListItem } from '@/features/reports/types';

export function PatientReportsTab({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(
    () => reportsApi.list({ patientId, size: 50 }),
    [patientId],
  );

  const columns: Column<ReportListItem>[] = [
    { key: 'no', header: 'Report', cell: (r) => <span className="font-mono text-xs">{r.reportNumber}</span> },
    { key: 'order', header: 'Order', cell: (r) => r.orderNumber },
    { key: 'date', header: 'Generated', cell: (r) => formatDate(r.generatedAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label="Critical" />}
          <Badge tone={REPORT_STATUS_TONE[r.status]}>{r.status}</Badge>
        </span>
      ),
    },
  ];

  return (
    <Card>
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data && data.content.length === 0 ? (
        <EmptyState title="No reports" message="Reports appear here once generated from approved results." />
      ) : (
        data && (
          <DataTable
            columns={columns}
            rows={data.content}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/app/reports/${r.id}`)}
          />
        )
      )}
    </Card>
  );
}
