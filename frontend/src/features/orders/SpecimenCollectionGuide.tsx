import { useMemo } from 'react';
import { FlaskConical, TestTube2, AlertCircle } from 'lucide-react';
import type { SpecimenType } from '@/features/catalog/types';
import { useT } from '@/i18n';

export interface TubeInfo {
  type: SpecimenType;
  name: string;
  capColor: string;
  capBorder?: string;
  dotColor: string;
  orderOfDraw: number;
  container: string;
  notes: string;
}

export const TUBE_SPECS: Record<SpecimenType, TubeInfo> = {
  BLOOD_CITRATE: {
    type: 'BLOOD_CITRATE',
    name: 'Sodium Citrate 3.2%',
    capColor: 'bg-sky-400 text-sky-950',
    dotColor: 'bg-sky-400',
    orderOfDraw: 1,
    container: 'Light Blue Cap Tube',
    notes: 'Invert 3-4 times. Fill to the mark for accurate 9:1 blood-to-anticoagulant ratio.',
  },
  BLOOD_SERUM: {
    type: 'BLOOD_SERUM',
    name: 'Serum / Clot Activator (SST)',
    capColor: 'bg-amber-400 text-amber-950',
    dotColor: 'bg-amber-400',
    orderOfDraw: 2,
    container: 'Gold / Red Cap Tube',
    notes: 'Invert 5 times. Allow 30 min clotting before centrifugation.',
  },
  BLOOD_HEPARIN: {
    type: 'BLOOD_HEPARIN',
    name: 'Lithium Heparin',
    capColor: 'bg-emerald-500 text-white',
    dotColor: 'bg-emerald-500',
    orderOfDraw: 3,
    container: 'Green Cap Tube',
    notes: 'Invert 8-10 times immediately after collection.',
  },
  BLOOD_EDTA: {
    type: 'BLOOD_EDTA',
    name: 'K2/K3 EDTA',
    capColor: 'bg-purple-600 text-white',
    dotColor: 'bg-purple-600',
    orderOfDraw: 4,
    container: 'Lavender / Purple Cap Tube',
    notes: 'Invert 8-10 times immediately to prevent micro-clotting.',
  },
  WHOLE_BLOOD: {
    type: 'WHOLE_BLOOD',
    name: 'Whole Blood (EDTA)',
    capColor: 'bg-purple-600 text-white',
    dotColor: 'bg-purple-600',
    orderOfDraw: 4,
    container: 'Lavender Cap Tube',
    notes: 'Invert gently. Do not centrifuge.',
  },
  BLOOD_FLUORIDE: {
    type: 'BLOOD_FLUORIDE',
    name: 'Sodium Fluoride / Potassium Oxalate',
    capColor: 'bg-slate-400 text-slate-950',
    dotColor: 'bg-slate-400',
    orderOfDraw: 5,
    container: 'Grey Cap Tube',
    notes: 'Invert 8-10 times. Inhibits glycolysis for accurate glucose measurement.',
  },
  URINE: {
    type: 'URINE',
    name: 'Urine (Sterile)',
    capColor: 'bg-yellow-400 text-yellow-950',
    dotColor: 'bg-yellow-400',
    orderOfDraw: 10,
    container: 'Sterile Urine Container',
    notes: 'Midstream clean catch sample preferred. Process within 2 hours.',
  },
  STOOL: {
    type: 'STOOL',
    name: 'Stool Specimen',
    capColor: 'bg-amber-800 text-white',
    dotColor: 'bg-amber-800',
    orderOfDraw: 11,
    container: 'Stool Container with Spoon',
    notes: 'Clean dry container without urine or water contamination.',
  },
  SPUTUM: {
    type: 'SPUTUM',
    name: 'Sputum',
    capColor: 'bg-teal-600 text-white',
    dotColor: 'bg-teal-600',
    orderOfDraw: 12,
    container: 'Sterile Sputum Cup',
    notes: 'Early morning deep cough sample, not saliva.',
  },
  SWAB: {
    type: 'SWAB',
    name: 'Swab / Transport Medium',
    capColor: 'bg-indigo-500 text-white',
    dotColor: 'bg-indigo-500',
    orderOfDraw: 13,
    container: 'Culture Swab Tube',
    notes: 'Maintain sterile technique. Label anatomical site clearly.',
  },
  CSF: {
    type: 'CSF',
    name: 'Cerebrospinal Fluid',
    capColor: 'bg-cyan-500 text-white',
    dotColor: 'bg-cyan-500',
    orderOfDraw: 14,
    container: 'Sterile CSF Tube',
    notes: 'Handle urgently. Transport to lab immediately at room temperature.',
  },
  BODY_FLUID: {
    type: 'BODY_FLUID',
    name: 'Body Fluid (Pleural / Ascitic)',
    capColor: 'bg-cyan-600 text-white',
    dotColor: 'bg-cyan-600',
    orderOfDraw: 15,
    container: 'Sterile Fluid Bottle',
    notes: 'Note source cavity. Record total volume if requested.',
  },
  TISSUE: {
    type: 'TISSUE',
    name: 'Biopsy / Tissue',
    capColor: 'bg-rose-600 text-white',
    dotColor: 'bg-rose-600',
    orderOfDraw: 16,
    container: '10% Neutral Buffered Formalin Container',
    notes: 'Ensure 10:1 ratio of formalin to tissue volume.',
  },
  OTHER: {
    type: 'OTHER',
    name: 'Specimen',
    capColor: 'bg-neutral-500 text-white',
    dotColor: 'bg-neutral-500',
    orderOfDraw: 20,
    container: 'Standard Specimen Container',
    notes: 'Follow standard biohazard handling protocols.',
  },
};

interface SpecimenGroup {
  specimenType: SpecimenType;
  tube: TubeInfo;
  tests: { name: string; code: string }[];
}

export function SpecimenCollectionGuide({
  items,
}: {
  items: { testName: string; testCode: string; specimenType?: SpecimenType }[];
}) {
  const t = useT();

  const groups = useMemo(() => {
    const map = new Map<SpecimenType, { name: string; code: string }[]>();

    for (const item of items) {
      const type = item.specimenType || 'BLOOD_SERUM';
      if (!map.has(type)) {
        map.set(type, []);
      }
      map.get(type)!.push({ name: item.testName, code: item.testCode });
    }

    const result: SpecimenGroup[] = [];
    for (const [specimenType, tests] of map.entries()) {
      const tube = TUBE_SPECS[specimenType] || TUBE_SPECS.OTHER;
      result.push({ specimenType, tube, tests });
    }

    // Sort blood tubes by standard clinical Order of Draw
    result.sort((a, b) => a.tube.orderOfDraw - b.tube.orderOfDraw);
    return result;
  }, [items]);

  if (groups.length === 0) return null;

  const totalVacutainers = groups.filter((g) => g.specimenType.startsWith('BLOOD') || g.specimenType === 'WHOLE_BLOOD').length;
  const totalOther = groups.length - totalVacutainers;

  return (
    <div className="rounded-lg border border-border bg-surface-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TestTube2 className="h-4 w-4 text-primary" aria-hidden />
          <h4 className="text-sm font-semibold text-foreground">{t('Phlebotomy & Sample Guide')}</h4>
        </div>
        <span className="font-mono text-xs text-muted">
          {totalVacutainers > 0 && t('{count} blood tube(s)', { count: totalVacutainers })}
          {totalVacutainers > 0 && totalOther > 0 && ' · '}
          {totalOther > 0 && t('{count} container(s)', { count: totalOther })}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.specimenType}
            className="flex items-start gap-3 rounded-md border border-border/80 bg-surface p-2.5 text-xs shadow-sm"
          >
            {/* Visual Tube / Container Indicator */}
            <div className="flex flex-col items-center pt-0.5">
              <span
                className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-bold shadow-xs ${group.tube.capColor}`}
                title={group.tube.container}
              >
                {group.specimenType.startsWith('BLOOD') || group.specimenType === 'WHOLE_BLOOD' ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                ) : (
                  <FlaskConical className="h-3.5 w-3.5" />
                )}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-semibold text-foreground truncate">{group.tube.name}</span>
                <span className="text-[10.5px] font-mono text-muted shrink-0">{group.tube.container}</span>
              </div>
              <p className="mt-0.5 text-muted leading-tight truncate">
                {group.tests.map((t) => t.code).join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalVacutainers > 1 && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted pt-1 border-t border-border/60">
          <AlertCircle className="h-3 w-3 text-muted shrink-0" aria-hidden />
          <span>
            {t('Clinical order of draw: Citrate (Blue) → Serum (Gold) → Heparin (Green) → EDTA (Lavender) → Fluoride (Grey)')}
          </span>
        </div>
      )}
    </div>
  );
}
