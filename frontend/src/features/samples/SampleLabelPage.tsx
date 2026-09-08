import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { samplesApi } from './api';
import { BarcodeLabel } from './BarcodeLabel';

/** Bare label view intended to be opened in its own tab and printed. */
export function SampleLabelPage() {
  const { id } = useParams<{ id: string }>();
  const { data: sample, loading, error, refetch } = useQuery(() => samplesApi.get(Number(id)), [id]);

  useEffect(() => {
    if (sample) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [sample]);

  if (loading && !sample) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!sample) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <BarcodeLabel
        value={sample.barcodeValue}
        patientName={sample.patientName}
        patientMrn={sample.patientMrn}
        specimen={SPECIMEN_LABELS[sample.specimenType]}
        container={sample.container}
      />
    </div>
  );
}
