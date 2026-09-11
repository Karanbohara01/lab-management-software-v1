import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { analyticsApi, type AnalyticsPoint as Point } from './api';

/** Simple horizontal bar list — value shown as a proportional bar, no chart library. */
function BarList({ points, format }: { points: Point[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  if (points.length === 0) return <p className="px-5 py-4 text-sm text-muted">No data for this period.</p>;
  return (
    <ul className="space-y-2 px-5 py-4">
      {points.map((p) => (
        <li key={p.label} className="text-sm">
          <div className="flex justify-between">
            <span className="text-foreground">{p.label}</span>
            <span className="text-muted">{format ? format(p.value) : p.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(p.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RevenueTrend({ points }: { points: Point[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);
  return (
    <div className="px-5 py-4">
      <p className="mb-2 text-sm text-muted">
        Total collected: <span className="font-medium text-foreground">{formatMoney(total)}</span>
      </p>
      <div className="flex h-32 items-end gap-1">
        {points.map((p) => (
          <div
            key={p.label}
            className="flex-1 rounded-t bg-primary/70"
            style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
            title={`${p.label}: ${formatMoney(p.value)}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
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
            <RevenueTrend points={data.revenueByDay} />
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
