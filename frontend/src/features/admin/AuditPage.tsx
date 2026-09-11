import { useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { exportCsv, exportXml } from '@/lib/exportData';
import { adminApi, type AuditListItem } from './api';

const PAGE_SIZE = 30;

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
  const toast = useToast();
  const [module, setModule] = useState('');
  const [actor, setActor] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const modules = useQuery(() => adminApi.auditModules(), []);
  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedActor = useDebouncedValue(actor, 300);

  const { data, loading, error, refetch } = useQuery(
    () =>
      adminApi.audit({
        module: module || undefined,
        actor: debouncedActor || undefined,
        query: debouncedSearch || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        page,
        size: PAGE_SIZE,
      }),
    [module, debouncedActor, debouncedSearch, from, to, page],
  );

  const detail = useQuery(
    () => (selectedId ? adminApi.auditDetail(selectedId) : Promise.resolve(null)),
    [selectedId],
  );

  const exportAll = async (format: 'csv' | 'xml') => {
    setExporting(true);
    try {
      const rows = await adminApi.exportAudit({
        module: module || undefined,
        actor: debouncedActor || undefined,
        query: debouncedSearch || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      });
      if (format === 'csv') {
        exportCsv(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'audit-log.csv');
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
        title="Audit log"
        description="Every sensitive operation, who performed it and what changed."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('csv')}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
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
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search summary"
          />
          <Select
            options={[{ value: '', label: 'All modules' }, ...(modules.data ?? []).map((m) => ({ value: m, label: m }))]}
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setPage(0);
            }}
          />
          <Input placeholder="Actor" value={actor} onChange={(e) => { setActor(e.target.value); setPage(0); }} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} aria-label="To date" />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No entries" message="No audit entries match these filters." />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(a) => a.id} onRowClick={(a) => setSelectedId(a.id)} />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>

      <Modal open={selectedId != null} onClose={() => setSelectedId(null)} title="Audit entry" size="lg">
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
