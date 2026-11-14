import { X } from 'lucide-react';
import { PatientPicker } from '@/features/patients/PatientPicker';
import type { PatientListItem } from '@/features/patients/types';
import { useT } from '@/i18n';

export interface PickedPatient {
  id: number;
  mrn: string;
  fullName: string;
}

/** Add-one-at-a-time picker for the "manually selected patients" recipient filter, built on the shared PatientPicker. */
export function PatientMultiPicker({
  selected,
  onChange,
}: {
  selected: PickedPatient[];
  onChange: (next: PickedPatient[]) => void;
}) {
  const t = useT();

  const add = (p: PatientListItem) => {
    if (selected.some((s) => s.id === p.id)) return;
    onChange([...selected, { id: p.id, mrn: p.mrn, fullName: p.fullName }]);
  };

  const remove = (id: number) => onChange(selected.filter((s) => s.id !== id));

  return (
    <div className="space-y-2">
      <PatientPicker onSelect={add} />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-foreground"
            >
              {p.fullName}
              <button type="button" onClick={() => remove(p.id)} aria-label={t('Remove')}>
                <X className="h-3 w-3 text-muted hover:text-foreground" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">{t('{count} patient(s) selected', { count: selected.length })}</p>
    </div>
  );
}
