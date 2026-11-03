import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { BackLink } from '@/components/BackLink';
import { usePageTitle } from '@/components/layout/PageTitleContext';
import { useQuery } from '@/hooks/useQuery';
import { branchesApi } from '@/features/branches/api';
import { revenueApi, type RevenueWindow } from './api';
import { RevenueReportDocument } from './RevenueReportDocument';
import type { RevenuePreset } from './types';

/**
 * The printable report, on its own route so the window it was generated for lives in a shareable
 * URL and so its `@page` rule is the only one mounted. Opens the browser's print dialog by itself
 * once the figures have loaded — the one action anyone arriving here wants.
 */
export function RevenueReportPage() {
  const [searchParams] = useSearchParams();
  const preset = searchParams.get('preset') as RevenuePreset | null;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const branchId = searchParams.get('branchId');

  const query: RevenueWindow =
    from && to
      ? { from, to, branchId: branchId ? Number(branchId) : undefined }
      : { preset: preset ?? 'TODAY', branchId: branchId ? Number(branchId) : undefined };
  const key = JSON.stringify(query);

  const { data, loading, error, refetch } = useQuery(() => revenueApi.report(query), [key], {
    cacheKey: `revenue-report:${key}`,
  });
  const branches = useQuery(() => branchesApi.list(false), [], { cacheKey: 'revenue:branches:all' });

  const period = data?.summary.period;
  usePageTitle(period ? `Revenue ${period.from === period.to ? period.from : `${period.from} to ${period.to}`}` : 'Revenue report');

  // Print once, when the figures first arrive — not on every refetch.
  const printed = useRef(false);
  useEffect(() => {
    if (!data || printed.current) return;
    printed.current = true;
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, [data]);

  const branchName = branchId ? (branches.data?.find((b) => b.id === Number(branchId))?.name ?? `Branch ${branchId}`) : null;

  return (
    <>
      <div data-print-hide className="mb-4">
        <BackLink to={`/app/revenue${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="mb-3">
          Back to Revenue
        </BackLink>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-heading-3 text-foreground">Revenue report</h1>
            <p className="text-body-sm text-muted">
              Print preview. Use your browser's "Save as PDF" destination to keep a copy.
            </p>
          </div>
          <Button onClick={() => window.print()} disabled={!data}>
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </Button>
        </div>
        {data && (data.payments.truncated || data.outstanding.truncated) && (
          <div className="mt-3">
            <Alert tone="warning">
              This period has more transactions than one report can list. The registers show the first{' '}
              {data.payments.truncated ? data.payments.rows.length : data.outstanding.rows.length} rows and the
              summary totals still cover everything — print a shorter period for a complete register.
            </Alert>
          </div>
        )}
      </div>

      {loading && !data ? (
        <LoadingState label="Building the report…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <RevenueReportDocument report={data} branchName={branchName} />
      ) : null}
    </>
  );
}
