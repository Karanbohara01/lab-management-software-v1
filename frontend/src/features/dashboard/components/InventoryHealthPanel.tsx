import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { inventoryApi } from '@/features/inventory/api';
import { STOCK_STATUS_LABEL, STOCK_STATUS_TONE, type StockStatus } from '@/features/inventory/types';
import { SectionHeader } from './SectionHeader';

const RISK_ORDER: StockStatus[] = ['EXPIRED', 'OUT_OF_STOCK', 'LOW_STOCK', 'EXPIRING_SOON'];

export function InventoryHealthPanel() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(() => inventoryApi.summary(), []);

  const atRisk = data ? RISK_ORDER.reduce((sum, s) => sum + (data.statusCounts[s] ?? 0), 0) : 0;

  return (
    <Card className="p-5">
      <SectionHeader
        title="Inventory health"
        description="Reagents and consumables needing action."
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate('/app/inventory')}>
            View all
          </Button>
        }
      />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data ? null : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {RISK_ORDER.filter((s) => (data.statusCounts[s] ?? 0) > 0).map((s) => (
              <Badge key={s} tone={STOCK_STATUS_TONE[s]}>
                {data.statusCounts[s]} {STOCK_STATUS_LABEL[s]}
              </Badge>
            ))}
          </div>
          {atRisk === 0 ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              All stock levels are healthy.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.alerts.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{item.name}</p>
                    <p className="truncate text-xs text-muted">
                      {item.quantityOnHand} {item.unit} on hand · min {item.minimumStock}
                    </p>
                  </div>
                  <Badge tone={STOCK_STATUS_TONE[item.status]}>{STOCK_STATUS_LABEL[item.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
