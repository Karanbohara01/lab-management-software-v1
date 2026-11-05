import { useState } from 'react';
import { Database, Download, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { useT } from '@/i18n';
import { formatDateTime } from '@/features/patients/format';
import { backupsApi } from './api';
import { BACKUP_STATUS_TONE, formatBytes, type BackupRun } from './types';

const PAGE_SIZE = 20;
/** Lives in the URL, so the page survives leaving the page and coming back. */
const PARAMS = { page: 1 };

function dt(iso: string | null): string {
  return iso ? formatDateTime(iso) : '—';
}

export function BackupsPage() {
  const t = useT();
  const { back } = useBackTarget();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.BACKUP_MANAGE);
  const [running, setRunning] = useState(false);

  const { params, set } = useListParams(PARAMS);
  const { data, loading, error, refetch } = useQuery(
    () => backupsApi.list({ page: params.page - 1, size: PAGE_SIZE }),
    [params.page],
    { cacheKey: `backups:${params.page}` },
  );

  const runBackup = async () => {
    setRunning(true);
    try {
      const run = await backupsApi.run();
      if (run.status === 'SUCCEEDED') {
        toast.success(
          t('Backup completed — {tables} tables, {rows} rows', { tables: run.tableCount ?? 0, rows: run.rowCount ?? 0 }),
        );
      } else {
        toast.error(t('Backup failed: {reason}', { reason: run.errorMessage ?? t('unknown error') }));
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to run backup'));
    } finally {
      setRunning(false);
    }
  };

  const columns: Column<BackupRun>[] = [
    { key: 'started', header: t('Started'), cell: (b) => dt(b.startedAt) },
    { key: 'completed', header: t('Completed'), cell: (b) => dt(b.completedAt), hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (b) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={BACKUP_STATUS_TONE[b.status]}>{b.status}</Badge>
          {b.status === 'FAILED' && b.errorMessage && <span className="text-xs text-danger">{b.errorMessage}</span>}
        </span>
      ),
    },
    { key: 'tables', header: t('Tables'), cell: (b) => b.tableCount ?? '—', hideOnMobile: true },
    { key: 'rows', header: t('Rows'), cell: (b) => b.rowCount ?? '—', hideOnMobile: true },
    { key: 'size', header: t('Size'), cell: (b) => formatBytes(b.fileSizeBytes) },
    { key: 'by', header: t('Triggered by'), cell: (b) => b.triggeredBy ?? t('Scheduled'), hideOnMobile: true },
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
                  aria-label={t('Download backup {id}', { id: b.id })}
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
        back={back}
        title={t('Backups')}
        description={t(
          "Database backup history — mandatory per the e-invoice procedure (every fiscal year's database and log must be backed up). Runs automatically overnight; old files are kept until you remove them from the server's disk. Each file holds data only, not the schema — restoring means letting the app recreate the schema (its migrations) on a fresh database first, then loading this file into it.",
        )}
        actions={
          canManage ? (
            <Button onClick={runBackup} loading={running}>
              <Database className="h-4 w-4" aria-hidden />
              {t('Run backup now')}
            </Button>
          ) : undefined
        }
      />

      {running && (
        <div className="mb-4">
          <Alert tone="info" title={t('Backup in progress')}>
            {t('This runs synchronously and can take a while on a large database — the page will update when it finishes.')}
          </Alert>
        </div>
      )}

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title={t('No backups yet')}
            message={t('A backup runs automatically overnight, or trigger one now.')}
            action={
              canManage ? (
                <Button onClick={runBackup} loading={running}>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  {t('Run backup now')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(b) => b.id} />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => set({ page: p + 1 })}
              />
            </>
          )
        )}
      </Card>
    </>
  );
}
