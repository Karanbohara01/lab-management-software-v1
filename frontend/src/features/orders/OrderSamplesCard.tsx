import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { SAMPLE_STATUS_LABEL, SAMPLE_STATUS_TONE, type SampleListItem } from '@/features/samples/types';
import { ThermalLabelModal } from '@/features/samples/ThermalLabelModal';
import { useT } from '@/i18n';

/**
 * Collect / Receive hand the whole sample up to the page, which owns the capture modals (so the
 * workflow bar's "Collect samples" and these row buttons share exactly one path — the same
 * modals the Sample page uses — and container, site and specimen condition are always recorded).
 */
export function OrderSamplesCard({
  samples,
  patientGender,
  patientAge,
  onCollect,
  onReceive,
}: {
  samples: SampleListItem[];
  patientGender?: string | null;
  patientAge?: string | number | null;
  onCollect: (sample: SampleListItem) => void;
  onReceive: (sample: SampleListItem) => void;
}) {
  const t = useT();
  const { hasPermission } = useAuth();
  const [printingSample, setPrintingSample] = useState<SampleListItem | null>(null);

  if (samples.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title={t('Samples')}
        description={t('{received}/{total} received', {
          received: samples.filter((s) => s.status === 'RECEIVED').length,
          total: samples.length,
        })}
      />
      <ul className="divide-y divide-border">
        {samples.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
            <div className="min-w-0">
              <LinkFrom to={`/app/samples/${s.id}`} className="font-mono text-xs text-muted hover:underline">
                {s.accessionNumber}
              </LinkFrom>
              <span className="ml-2 text-foreground">{t(SPECIMEN_LABELS[s.specimenType])}</span>
              <span className="ml-2 text-muted">· {t('{count} test(s)', { count: s.testCount })}</span>
              {s.conditionSummary && (
                <span className="ml-2 text-xs text-warning">· {s.conditionSummary}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={SAMPLE_STATUS_TONE[s.status]}>{t(SAMPLE_STATUS_LABEL[s.status])}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPrintingSample(s)}
                title={t('Print thermal label')}
                aria-label={t('Print label for {acc}', { acc: s.accessionNumber })}
              >
                <Printer className="h-4 w-4" aria-hidden />
              </Button>
              {s.status === 'AWAITING_COLLECTION' && hasPermission(PERMISSIONS.SAMPLE_COLLECT) && (
                <Button size="sm" variant="secondary" onClick={() => onCollect(s)}>
                  {t('Collect')}
                </Button>
              )}
              {s.status === 'COLLECTED' && hasPermission(PERMISSIONS.SAMPLE_RECEIVE) && (
                <Button size="sm" onClick={() => onReceive(s)}>
                  {t('Receive')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {printingSample && (
        <ThermalLabelModal
          open={!!printingSample}
          onClose={() => setPrintingSample(null)}
          barcodeValue={printingSample.accessionNumber}
          patientName={printingSample.patientName}
          patientMrn={printingSample.patientMrn}
          patientGender={printingSample.patientGender ?? patientGender}
          patientAge={printingSample.patientAgeYears ?? patientAge}
          specimen={t(SPECIMEN_LABELS[printingSample.specimenType])}
        />
      )}
    </Card>
  );
}
