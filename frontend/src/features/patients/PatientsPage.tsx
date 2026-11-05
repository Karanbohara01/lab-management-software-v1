import { Plus, ShieldAlert, Star, Upload } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { patientsApi } from './api';
import type { PatientCategory, PatientListItem } from './types';
import { PATIENT_CATEGORIES, categoryLabel, tOpts } from './constants';
import { formatAge } from './format';
import { useT } from '@/i18n';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from a patient lands on the same search, filter and page. */
const PARAMS = { q: '', category: '', page: 1 };

export function PatientsPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.PATIENT_WRITE);
  const canImport = hasPermission(PERMISSIONS.PATIENT_IMPORT);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const { data, loading, error, refetch } = useQuery(
    () =>
      patientsApi.list({
        query: params.q || undefined,
        category: (params.category as PatientCategory) || undefined,
        activeOnly: false,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.q, params.category, params.page],
    { cacheKey: `patients:${params.q}:${params.category}:${params.page}` },
  );

  const columns: Column<PatientListItem>[] = [
    { key: 'mrn', header: 'MRN', cell: (p) => <span className="font-mono text-xs text-muted">{p.mrn}</span> },
    {
      key: 'name',
      header: t('Name'),
      cell: (p) => (
        <span className="flex items-center gap-1.5">
          <span className="font-medium">
            {p.salutation ? `${p.salutation} ` : ''}
            {p.fullName}
          </span>
          {p.vip && <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-label="VIP" />}
          {p.confidential && <ShieldAlert className="h-3.5 w-3.5 text-danger" aria-label="Confidential" />}
        </span>
      ),
    },
    { key: 'demo', header: t('Age / Sex'), cell: (p) => `${formatAge(p.ageYears)} · ${p.gender[0]}` },
    { key: 'phone', header: t('Phone'), cell: (p) => p.phone ?? '—', hideOnMobile: true },
    {
      key: 'category',
      header: t('Category'),
      cell: (p) => <span className="text-sm text-muted">{categoryLabel(p.category)}</span>,
      hideOnMobile: true,
    },
    { key: 'doctor', header: t('Referred by'), cell: (p) => p.referringDoctorName ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (p) =>
        p.deceased ? (
          <Badge tone="neutral">{t('Deceased')}</Badge>
        ) : (
          <Badge tone={p.active ? 'success' : 'neutral'}>{t(p.active ? 'Active' : 'Inactive')}</Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Patients')}
        description={t('Register patients and open a longitudinal view of their orders, invoices and reports.')}
        actions={
          <div className="flex flex-wrap gap-2">
            {canImport && (
              <Button variant="secondary" onClick={() => navigate('/app/patients/import')}>
                <Upload className="h-4 w-4" aria-hidden />
                {t('Import patients')}
              </Button>
            )}
            {canWrite && (
              <Button onClick={() => navigate('/app/patients/new')}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('Register patient')}
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-sm sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search by name, MRN, phone or email')}
            />
          </div>
          <Select
            aria-label={t('Filter by category')}
            className="sm:w-52"
            options={[{ value: '', label: t('All categories') }, ...tOpts(PATIENT_CATEGORIES)]}
            value={params.category}
            onChange={(e) => set({ category: e.target.value })}
          />
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title={t('No patients found')}
            message={
              params.q || params.category
                ? t('Try a different search or filter.')
                : t('Register the first patient to get started.')
            }
            action={
              canWrite && !params.q && !params.category ? (
                <Button onClick={() => navigate('/app/patients/new')}>{t('Register patient')}</Button>
              ) : undefined
            }
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(p) => p.id}
                rowHref={(p) => `/app/patients/${p.id}`}
                onRowClick={(p) => navigate(`/app/patients/${p.id}`)}
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
