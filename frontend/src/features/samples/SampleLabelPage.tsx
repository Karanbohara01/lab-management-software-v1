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
    <>
      {/* Scoped to this route: a plain (unnamed) @page rule, present in the DOM only while this
          page is mounted. CSS named pages (`@page label { ... }` + `page: label` on an element,
          tried first) turned out to have no real effect in Chromium's print pipeline — confirmed
          live via a print-media PDF render that still came out Letter-sized despite the named-page
          CSS being present. This page is always opened in its own dedicated tab for printing (see
          below), so there's no other print flow sharing this document to conflict with. */}
      <style>{'@media print { @page { size: 50mm 70mm; margin: 0; } }'}</style>
      <div id="report-print" className="flex min-h-screen items-center justify-center bg-white p-6">
        <BarcodeLabel
          value={sample.barcodeValue}
          patientName={sample.patientName}
          patientMrn={sample.patientMrn}
          specimen={SPECIMEN_LABELS[sample.specimenType]}
          container={sample.container}
        />
      </div>
    </>
  );
}
