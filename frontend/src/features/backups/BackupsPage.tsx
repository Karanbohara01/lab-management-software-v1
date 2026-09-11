import { useState } from 'react';
import { Database, Download, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { backupsApi } from './api';
import { BACKUP_STATUS_TONE, formatBytes, type BackupRun } from './types';

const PAGE_SIZE = 20;

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export function BackupsPage() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.BACKUP_MANAGE);
  const [page, setPage] = useState(0);
  const [running, setRunning] = useState(false);

  const { data, loading, error, refetch } = useQuery(() => backupsApi.list({ page, size: PAGE_SIZE }), [page]);

  const runBackup = async () => {
    setRunning(true);
    try {
      const run = await backupsApi.run();
      if (run.status === 'SUCCEEDED') {
        toast.success(`Backup completed — ${run.tableCount} tables, ${run.rowCount} rows`);
      } else {
        toast.error(`Backup failed: ${run.errorMessage ?? 'unknown error'}`);
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to run backup');
    } finally {
      setRunning(false);
    }
  };

  const columns: Column<BackupRun>[] = [
    { key: 'started', header: 'Started', cell: (b) => dt(b.startedAt) },
    { key: 'completed', header: 'Completed', cell: (b) => dt(b.completedAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={BACKUP_STATUS_TONE[b.status]}>{b.status}</Badge>
          {b.status === 'FAILED' && b.errorMessage && <span className="text-xs text-danger">{b.errorMessage}</span>}
        </span>
      ),
    },
    { key: 'tables', header: 'Tables', cell: (b) => b.tableCount ?? '—', hideOnMobile: true },
    { key: 'rows', header: 'Rows', cell: (b) => b.rowCount ?? '—', hideOnMobile: true },
    { key: 'size', header: 'Size', cell: (b) => formatBytes(b.fileSizeBytes) },
    { key: 'by', header: 'Triggered by', cell: (b) => b.triggeredBy ?? 'Scheduled', hideOnMobile: true },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            cell: (b: BackupRun) =>
              b.status === 'SUCCEEDED' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    backupsApi.download(b.id, `lims-backup-${b.id}.sql.gz`);
                  }}
                  className="rounded p-1 text-muted hover:bg-surface-muted"
                  aria-label={`Download backup ${b.id}`}
                >
                  <Download className="h-4 w-4" aria-hidden />
                </button>
              ) : null,
          } as Column<BackupRun>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Backups"
        description="Database backup history — mandatory per the e-invoice procedure (every fiscal year's database and log must be backed up). Runs automatically overnight; old files are kept until you remove them from the server's disk. Each file holds data only, not the schema — restoring means letting the app recreate the schema (its migrations) on a fresh database first, then loading this file into it."
        actions={
          canManage ? (
            <Button onClick={runBackup} loading={running}>
              <Database className="h-4 w-4" aria-hidden />
              Run backup now
            </Button>
          ) : undefined
        }
      />

      {running && (
        <div className="mb-4">
          <Alert tone="info" title="Backup in progress">
            This runs synchronously and can take a while on a large database — the page will update when it finishes.
          </Alert>
        </div>
      )}

      <Card>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No backups yet"
            message="A backup runs automatically overnight, or trigger one now."
            action={canManage ? <Button onClick={runBackup} loading={running}><RefreshCw className="h-4 w-4" aria-hidden />Run backup now</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(b) => b.id} />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>
    </>
  );
}
