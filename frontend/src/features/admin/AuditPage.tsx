import { useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { exportCsv, exportExcel, exportXml } from '@/lib/exportData';
import { adminApi, type AuditListItem } from './api';

const PAGE_SIZE = 30;
/**
 * Lives in the URL, so the filters and page survive leaving the page, and `entry` makes a single
 * audit entry linkable — it opens the detail modal on load.
 */
const PARAMS = { q: '', module: '', actor: '', from: '', to: '', page: 1, entry: 0 };

const EXPORT_COLUMNS: { key: keyof AuditListItem; header: string }[] = [
  { key: 'createdAt', header: 'When' },
  { key: 'actor', header: 'Actor' },
  { key: 'module', header: 'Module' },
  { key: 'action', header: 'Action' },
  { key: 'entityType', header: 'EntityType' },
  { key: 'entityId', header: 'EntityId' },
  { key: 'summary', header: 'Summary' },
  { key: 'ipAddress', header: 'IpAddress' },
];

function pretty(json: string | null): string {
  if (!json) return '—';
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

export function AuditPage() {
  const { back } = useBackTarget();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));
  const [actor, setActor] = useSearchInput(params.actor, (a) => set({ actor: a }, { replace: true }));

  const modules = useQuery(() => adminApi.auditModules(), []);

  const { data, loading, error, refetch } = useQuery(
    () =>
      adminApi.audit({
        module: params.module || undefined,
        actor: params.actor || undefined,
        query: params.q || undefined,
        from: params.from ? new Date(params.from).toISOString() : undefined,
        to: params.to ? new Date(params.to).toISOString() : undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.module, params.actor, params.q, params.from, params.to, params.page],
    { cacheKey: `audit:${params.module}:${params.actor}:${params.q}:${params.from}:${params.to}:${params.page}` },
  );

  const detail = useQuery(
    () => (params.entry ? adminApi.auditDetail(params.entry) : Promise.resolve(null)),
    [params.entry],
  );

  const exportAll = async (format: 'csv' | 'xls' | 'xml') => {
    setExporting(true);
    try {
      const rows = await adminApi.exportAudit({
        module: params.module || undefined,
        actor: params.actor || undefined,
        query: params.q || undefined,
        from: params.from ? new Date(params.from).toISOString() : undefined,
        to: params.to ? new Date(params.to).toISOString() : undefined,
      });
      if (format === 'csv') {
        exportCsv(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'audit-log.csv');
      } else if (format === 'xls') {
        exportExcel(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'AuditLog', 'audit-log.xls');
      } else {
        exportXml(
          rows as unknown as Record<string, unknown>[],
          EXPORT_COLUMNS as { key: string; header: string }[],
          'AuditLog',
          'Entry',
          'audit-log.xml',
        );
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<AuditListItem>[] = [
    { key: 'when', header: 'When', cell: (a) => new Date(a.createdAt).toLocaleString() },
    { key: 'actor', header: 'Actor', cell: (a) => a.actor },
    { key: 'module', header: 'Module', cell: (a) => <Badge tone="neutral">{a.module}</Badge>, hideOnMobile: true },
    { key: 'action', header: 'Action', cell: (a) => <span className="font-mono text-xs">{a.action}</span> },
    { key: 'summary', header: 'Summary', cell: (a) => a.summary ?? '—' },
  ];

  return (
    <>
      <PageHeader
        back={back}
        title="Audit log"
        description="Every sensitive operation, who performed it and what changed."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('csv')}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('xls')}>
              <Download className="h-4 w-4" aria-hidden />
              Export Excel
            </Button>
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('xml')}>
              <Download className="h-4 w-4" aria-hidden />
              Export XML
            </Button>
          </div>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search summary" />
          <Select
            options={[{ value: '', label: 'All modules' }, ...(modules.data ?? []).map((m) => ({ value: m, label: m }))]}
            value={params.module}
            onChange={(e) => set({ module: e.target.value })}
          />
          <Input placeholder="Actor" value={actor} onChange={(e) => setActor(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={params.from} onChange={(e) => set({ from: e.target.value })} aria-label="From date" />
            <Input type="date" value={params.to} onChange={(e) => set({ to: e.target.value })} aria-label="To date" />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No entries" message="No audit entries match these filters." />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(a) => a.id}
                onRowClick={(a) => set({ entry: a.id }, { resetPage: false })}
              />
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

      <Modal open={params.entry !== 0} onClose={() => set({ entry: 0 }, { resetPage: false })} title="Audit entry" size="lg">
        {detail.loading || !detail.data ? (
          <LoadingState />
        ) : (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-2">
              <div><dt className="text-muted">Actor</dt><dd className="text-foreground">{detail.data.actor}</dd></div>
              <div><dt className="text-muted">When</dt><dd className="text-foreground">{new Date(detail.data.createdAt).toLocaleString()}</dd></div>
              <div><dt className="text-muted">Module / action</dt><dd className="text-foreground">{detail.data.module} · {detail.data.action}</dd></div>
              <div><dt className="text-muted">Entity</dt><dd className="text-foreground">{detail.data.entityType ?? '—'} {detail.data.entityId ?? ''}</dd></div>
              <div><dt className="text-muted">IP</dt><dd className="text-foreground">{detail.data.ipAddress ?? '—'}</dd></div>
            </dl>
            {detail.data.summary && <p className="rounded-md bg-surface-muted p-2">{detail.data.summary}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted">Before</p>
                <pre className="max-h-72 overflow-auto rounded-md border border-border bg-surface-muted p-2 text-xs">{pretty(detail.data.beforeState)}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted">After</p>
                <pre className="max-h-72 overflow-auto rounded-md border border-border bg-surface-muted p-2 text-xs">{pretty(detail.data.afterState)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
