import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { cn } from '@/lib/cn';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { formatDate } from '@/features/patients/format';
import { irdApi } from './api';
import { IrdConfigBanner } from './IrdConfigBanner';
import {
  CREDIT_NOTE_STATUS_LABEL,
  CREDIT_NOTE_STATUS_TONE,
  IRD_STATUS_LABEL,
  IRD_STATUS_TONE,
  type IrdStatus,
  type IrdSubmissionListItem,
} from './types';

const PAGE_SIZE = 20;
const TABS: { value: '' | IrdStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'NOT_SUBMITTED', label: 'Not submitted' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACCEPTED', label: 'Accepted' },
];
/** Lives in the URL, so returning from a submission lands on the same tab, search and page. */
const PARAMS = { q: '', status: '', page: 1 };

export function IrdSubmissionsPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.IRD_SUBMISSION_MANAGE);
  const [sweeping, setSweeping] = useState(false);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const summary = useQuery(() => irdApi.summary(), []);
  const { data, loading, error, refetch } = useQuery(
    () =>
      irdApi.list({
        status: (params.status as IrdStatus) || undefined,
        query: params.q || undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.status, params.q, params.page],
    { cacheKey: `ird:${params.q}:${params.status}:${params.page}` },
  );

  const runSweepNow = async () => {
    setSweeping(true);
    try {
      const { retried } = await irdApi.runAutoRetrySweep();
      toast.success(
        retried === 0
          ? t('No failed submissions were eligible for retry right now.')
          : t(retried === 1 ? 'Retried {retried} failed submission.' : 'Retried {retried} failed submissions.', { retried }),
      );
      refetch();
      summary.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to run the retry sweep'));
    } finally {
      setSweeping(false);
    }
  };

  const columns: Column<IrdSubmissionListItem>[] = [
    { key: 'inv', header: t('Invoice'), cell: (s) => <span className="font-mono text-xs">{s.invoiceNumber ?? '—'}</span> },
    { key: 'patient', header: t('Patient'), cell: (s) => s.patientName },
    { key: 'attempts', header: t('Attempts'), cell: (s) => s.attemptCount, hideOnMobile: true },
    { key: 'updated', header: t('Updated'), cell: (s) => formatDate(s.updatedAt), hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (s) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={IRD_STATUS_TONE[s.status]}>{t(IRD_STATUS_LABEL[s.status])}</Badge>
          {s.manual && <Badge tone="neutral">{t('Manual')}</Badge>}
          {s.creditNoteStatus !== 'NOT_NEEDED' && (
            <Badge tone={CREDIT_NOTE_STATUS_TONE[s.creditNoteStatus]}>{t(CREDIT_NOTE_STATUS_LABEL[s.creditNoteStatus])}</Badge>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('IRD / e-Billing')}
        description={t('Track electronic submission of issued invoices to IRD / CBMS.')}
        actions={
          canManage ? (
            <Button variant="secondary" size="sm" loading={sweeping} onClick={runSweepNow}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('Retry failed now')}
            </Button>
          ) : undefined
        }
      />
      <IrdConfigBanner />

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {TABS.map((tab) => {
            const count = tab.value ? summary.data?.[tab.value] : undefined;
            return (
              <button
                key={tab.value || 'all'}
                onClick={() => set({ status: tab.value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  params.status === tab.value ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-muted',
                )}
              >
                {t(tab.label)}
                {count != null && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 text-xs">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search invoice no. or patient')}
            />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title={t('Nothing here')} message={t('A tracking record is created when an invoice is issued.')} />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(s) => s.id}
                rowHref={(s) => `/app/ird/${s.id}`}
                onRowClick={(s) => navigate(`/app/ird/${s.id}`)}
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
    </>
  );
}
