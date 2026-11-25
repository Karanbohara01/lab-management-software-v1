import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import {
  AnimatedNumber,
  SPRING_SMOOTH,
  StaggerContainer,
  StaggerItem,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { useListParams } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useT, tOpts } from '@/i18n';
import { analyticsApi, type AnalyticsPoint as Point } from './api';
import { RevenueTrendChart } from './RevenueTrendChart';

/** The window lives in the URL, so a view of the figures can be bookmarked or shared. */
const PARAMS = { days: '30' };

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

/** Ranked horizontal bar list — spring-animated fill bars with staggered entrance and animated counts. */
function BarList({ points, format }: { points: Point[]; format?: (n: number) => string }) {
  const t = useT();
  const skipMotion = isTestEnv();
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0) || 1;

  if (points.length === 0) return <p className="px-5 py-4 text-sm text-muted">{t('No data for this period.')}</p>;

  return (
    <motion.ul
      variants={staggerContainerVariants}
      initial={skipMotion ? false : 'hidden'}
      animate="show"
      className="space-y-3 px-5 py-4"
    >
      {points.map((p, idx) => {
        const widthPct = Math.max(2, (p.value / max) * 100);
        const sharePct = Math.round((p.value / total) * 100);
        return (
          <motion.li
            key={p.label}
            variants={staggerItemVariants}
            className="group text-sm"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                {p.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                <AnimatedNumber
                  value={p.value}
                  format={format ?? ((n) => String(Math.round(n)))}
                  className="font-medium text-foreground"
                />
                <span className="ml-1.5 text-xs text-muted">({sharePct}%)</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
              <motion.div
                className="h-2 rounded-full bg-primary transition-colors group-hover:bg-primary/85"
                initial={skipMotion ? false : { width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{
                  ...SPRING_SMOOTH,
                  delay: skipMotion ? 0 : idx * 0.05,
                }}
              />
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

export function AnalyticsPage() {
  const t = useT();
  const { params, set } = useListParams(PARAMS);
  const { data, loading, error, refetch } = useQuery(
    () => analyticsApi.overview(Number(params.days)),
    [params.days],
    { cacheKey: `analytics:${params.days}` },
  );

  return (
    <>
      <PageHeader
        title={t('Analytics')}
        description={t('Revenue, workload and referral trends.')}
        actions={
          <div className="w-40">
            <Select
              options={tOpts(RANGE_OPTIONS)}
              value={params.days}
              onChange={(e) => set({ days: e.target.value })}
            />
          </div>
        }
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <StaggerContainer key={params.days} className="grid gap-4 lg:grid-cols-2">
          <StaggerItem className="lg:col-span-2">
            <Card>
              <CardHeader title={t('Revenue collected')} />
              <RevenueTrendChart points={data.revenueByDay} />
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader title={t('Tests by department')} />
              <BarList points={data.testsByDepartment} />
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader title={t('Most ordered tests')} />
              <BarList points={data.topTests} />
            </Card>
          </StaggerItem>
          <StaggerItem className="lg:col-span-2">
            <Card>
              <CardHeader title={t('Top referring doctors')} />
              <BarList points={data.topReferrers} />
            </Card>
          </StaggerItem>
        </StaggerContainer>
      ) : null}
    </>
  );
}
