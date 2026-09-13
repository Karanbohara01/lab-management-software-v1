import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { analyticsApi, type AnalyticsPoint as Point } from './api';
import { RevenueTrendChart } from './RevenueTrendChart';

/** Ranked horizontal bar list — value direct-labeled, single hue sized by magnitude. */
function BarList({ points, format }: { points: Point[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  if (points.length === 0) return <p className="px-5 py-4 text-sm text-muted">No data for this period.</p>;
  return (
    <ul className="space-y-2.5 px-5 py-4">
      {points.map((p) => (
        <li key={p.label} className="group text-sm">
          <div className="flex justify-between">
            <span className="text-foreground">{p.label}</span>
            <span className="tabular-nums text-muted">{format ? format(p.value) : p.value}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-2 rounded-full bg-primary transition-[width] duration-300 group-hover:bg-primary/80"
              style={{ width: `${Math.max(2, (p.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsPage() {
  const [days, setDays] = useState('30');
  const { data, loading, error, refetch } = useQuery(() => analyticsApi.overview(Number(days)), [days]);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Revenue, workload and referral trends."
        actions={
          <div className="w-40">
            <Select
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
              ]}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        }
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader title="Revenue collected" />
            <RevenueTrendChart points={data.revenueByDay} />
          </Card>
          <Card>
            <CardHeader title="Tests by department" />
            <BarList points={data.testsByDepartment} />
          </Card>
          <Card>
            <CardHeader title="Most ordered tests" />
            <BarList points={data.topTests} />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Top referring doctors" />
            <BarList points={data.topReferrers} />
          </Card>
        </div>
      ) : null}
    </>
  );
}
