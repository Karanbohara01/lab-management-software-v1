import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { communicationApi } from './api';
import type { OptOut } from './types';
import { OptOutFormModal } from './components/OptOutFormModal';
import { useT } from '@/i18n';

const PAGE_SIZE = 25;
const PARAMS = { page: 1 };

export function OptOutsPage() {
  const t = useT();
  const { back } = useBackTarget();
  const toast = useToast();
  const { params, set } = useListParams(PARAMS);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<OptOut | null>(null);

  const { data, loading, error, refetch } = useQuery(
    () => communicationApi.optOuts.list(params.page - 1, PAGE_SIZE),
    [params.page],
  );

  const remove = async () => {
    if (!removing) return;
    await communicationApi.optOuts.remove(removing.id);
    toast.success(t('Removed from the do-not-contact list'));
    setRemoving(null);
    refetch();
  };

  const columns: Column<OptOut>[] = [
    { key: 'phone', header: t('Phone'), cell: (o) => <span className="font-mono text-sm">{o.phone}</span> },
    { key: 'patient', header: t('Patient'), cell: (o) => o.patientName ?? '—' },
    { key: 'reason', header: t('Reason'), cell: (o) => o.reason ?? '—' },
    { key: 'date', header: t('Opted out'), cell: (o) => new Date(o.createdAt).toLocaleDateString(), hideOnMobile: true },
    { key: 'by', header: t('By'), cell: (o) => o.createdBy ?? '—', hideOnMobile: true },
    {
      key: 'actions',
      header: '',
      cell: (o) => (
        <Button variant="ghost" size="sm" onClick={() => setRemoving(o)}>
          <X className="h-3.5 w-3.5" aria-hidden />
          {t('Remove')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        back={back}
        title={t('Opted-out numbers')}
        description={t('Phone numbers that asked not to be contacted — never sent SMS by this system, manual, automated, or campaign, until removed from this list.')}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('Opt out a number')}
          </Button>
        }
      />

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title={t('No opted-out numbers')} message={t('Numbers that ask not to be contacted again will appear here.')} />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(o) => o.id} />
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

      <OptOutFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={refetch} />

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title={t('Remove from the do-not-contact list?')}
        message={t('{phone} can be messaged again — by any automation rule, campaign, or manual send.', { phone: removing?.phone ?? '' })}
        confirmLabel={t('Remove')}
      />
    </>
  );
}
