import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { antibioticsApi } from '@/features/microbiology/api';
import { resultsApi } from './api';
import {
  CULTURE_GROWTH_LABEL,
  SUSCEPTIBILITY_LABEL,
  type CultureGrowth,
  type OrganismSignificance,
  type ResultDetail,
  type Susceptibility,
  type SusceptibilityMethod,
} from './types';

const GROWTH_ORDER: CultureGrowth[] = ['NO_GROWTH', 'NORMAL_FLORA', 'MIXED_FLORA', 'GROWTH'];
const SIR: Susceptibility[] = ['S', 'I', 'R', 'SDD', 'NT'];
const SIGNIFICANCE: OrganismSignificance[] = ['PATHOGEN', 'PROBABLE_PATHOGEN', 'COMMENSAL', 'CONTAMINANT'];

const COMMON_ORGANISMS = [
  'Escherichia coli',
  'Klebsiella pneumoniae',
  'Pseudomonas aeruginosa',
  'Proteus mirabilis',
  'Enterococcus faecalis',
  'Staphylococcus aureus',
  'Staphylococcus saprophyticus',
  'Enterobacter cloacae',
  'Acinetobacter baumannii',
  'Citrobacter freundii',
  'Streptococcus agalactiae (GBS)',
  'Salmonella Typhi',
  'Candida albicans',
  'Coagulase-negative Staphylococcus',
];

const SIR_TONE: Record<Susceptibility, string> = {
  S: 'bg-success/15 text-success',
  I: 'bg-warning/15 text-warning',
  R: 'bg-danger/15 text-danger',
  SDD: 'bg-warning/15 text-warning',
  NT: 'bg-surface-muted text-muted',
};

interface EditSusc {
  antibioticId: number | null;
  antibioticName: string;
  interpretation: Susceptibility;
  mic: string;
  zone: string;
  method: SusceptibilityMethod | '';
}

interface EditIsolate {
  organismName: string;
  colonyCount: string;
  significance: OrganismSignificance;
  note: string;
  susceptibilities: EditSusc[];
}

function blankSusc(): EditSusc {
  return { antibioticId: null, antibioticName: '', interpretation: 'S', mic: '', zone: '', method: '' };
}

function blankIsolate(): EditIsolate {
  return { organismName: '', colonyCount: '', significance: 'PATHOGEN', note: '', susceptibilities: [blankSusc()] };
}

export function CultureEntryForm({
  result,
  editable,
  onSaved,
}: {
  result: ResultDetail;
  editable: boolean;
  onSaved: () => void;
}) {
  const toast = useToast();
  const antibiotics = useQuery(() => antibioticsApi.list(true), []);
  const [growth, setGrowth] = useState<CultureGrowth>(result.culture?.growth ?? 'NO_GROWTH');
  const [comment, setComment] = useState(result.comment ?? '');
  const [isolates, setIsolates] = useState<EditIsolate[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGrowth(result.culture?.growth ?? 'NO_GROWTH');
    setComment(result.comment ?? '');
    setIsolates(
      (result.culture?.isolates ?? []).map((i) => ({
        organismName: i.organismName,
        colonyCount: i.colonyCount ?? '',
        significance: i.significance,
        note: i.note ?? '',
        susceptibilities: i.susceptibilities.map((s) => ({
          antibioticId: s.antibioticId,
          antibioticName: s.antibioticName,
          interpretation: s.interpretation,
          mic: s.mic ?? '',
          zone: s.zone ?? '',
          method: s.method ?? '',
        })),
      })),
    );
  }, [result]);

  const abOptions = useMemo(
    () => [
      { value: '', label: 'Select antibiotic…' },
      ...(antibiotics.data ?? []).map((a) => ({
        value: String(a.id),
        label: a.drugClass ? `${a.name} — ${a.drugClass}` : a.name,
      })),
    ],
    [antibiotics.data],
  );

  const patchIsolate = (idx: number, patch: Partial<EditIsolate>) =>
    setIsolates((prev) => prev.map((iso, i) => (i === idx ? { ...iso, ...patch } : iso)));

  const patchSusc = (iso: number, s: number, patch: Partial<EditSusc>) =>
    setIsolates((prev) =>
      prev.map((it, i) =>
        i === iso
          ? { ...it, susceptibilities: it.susceptibilities.map((su, j) => (j === s ? { ...su, ...patch } : su)) }
          : it,
      ),
    );

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        growth,
        comment: comment.trim() || null,
        isolates:
          growth === 'GROWTH'
            ? isolates
                .filter((i) => i.organismName.trim())
                .map((i) => ({
                  organismName: i.organismName.trim(),
                  colonyCount: i.colonyCount.trim() || null,
                  significance: i.significance,
                  note: i.note.trim() || null,
                  susceptibilities: i.susceptibilities
                    .filter((s) => s.antibioticId != null || s.antibioticName.trim())
                    .map((s) => ({
                      antibioticId: s.antibioticId,
                      antibioticName: s.antibioticName.trim() || null,
                      interpretation: s.interpretation,
                      mic: s.mic.trim() || null,
                      zone: s.zone.trim() || null,
                      method: s.method || null,
                    })),
                }))
            : [],
      };
      await resultsApi.saveCulture(result.id, body);
      toast.success('Culture result saved');
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save culture result');
    } finally {
      setSaving(false);
    }
  };

  // ---- read-only view ------------------------------------------------
  if (!editable) {
    const c = result.culture;
    return (
      <Card>
        <CardHeader title="Culture & sensitivity" />
        <CardBody className="space-y-4">
          {!c ? (
            <p className="text-sm text-muted">No culture result entered yet.</p>
          ) : (
            <>
              <p className="text-sm">
                <Badge tone={c.growth === 'GROWTH' ? 'warning' : 'success'}>{CULTURE_GROWTH_LABEL[c.growth]}</Badge>{' '}
                <span className="text-muted">{c.growthDescription}</span>
              </p>
              {c.isolates.map((iso) => (
                <div key={iso.sequenceNo} className="rounded-md border border-border p-3">
                  <p className="font-medium">
                    {iso.sequenceNo}. <span className="italic">{iso.organismName}</span>
                    {iso.colonyCount ? <span className="text-muted"> — {iso.colonyCount}</span> : null}
                    <span className="ml-2 inline-block align-middle">
                      <Badge tone="neutral">{iso.significance.replace('_', ' ').toLowerCase()}</Badge>
                    </span>
                  </p>
                  {iso.susceptibilities.length > 0 && (
                    <table className="mt-2 w-full text-sm">
                      <tbody>
                        {iso.susceptibilities.map((s, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="py-1">{s.antibioticName}</td>
                            <td className="py-1">
                              <span className={cn('rounded px-1.5 py-0.5 text-xs font-semibold', SIR_TONE[s.interpretation])}>
                                {s.interpretation}
                              </span>
                            </td>
                            <td className="py-1 text-xs text-muted">
                              {s.zone ? `zone ${s.zone} mm` : s.mic ? `MIC ${s.mic}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {iso.note && <p className="mt-1 text-xs text-muted">{iso.note}</p>}
                </div>
              ))}
              {result.comment && <p className="whitespace-pre-line text-sm text-muted">{result.comment}</p>}
            </>
          )}
        </CardBody>
      </Card>
    );
  }

  // ---- editor ------------------------------------------------------
  return (
    <Card>
      <CardHeader title="Culture & sensitivity" />
      <CardBody className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Growth outcome</p>
          <div className="flex flex-wrap gap-2">
            {GROWTH_ORDER.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrowth(g)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm',
                  growth === g ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-surface-muted',
                )}
              >
                {CULTURE_GROWTH_LABEL[g]}
              </button>
            ))}
          </div>
        </div>

        {growth === 'GROWTH' && (
          <div className="space-y-3">
            <datalist id="culture-organisms">
              {COMMON_ORGANISMS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>

            {isolates.length === 0 && (
              <p className="text-sm text-muted">Add the organism(s) isolated from this specimen.</p>
            )}

            {isolates.map((iso, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Isolate {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setIsolates((p) => p.filter((_, i) => i !== idx))}
                    className="rounded p-1 text-muted hover:text-danger"
                    aria-label={`Remove isolate ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Input
                    label="Organism"
                    list="culture-organisms"
                    className="sm:col-span-2"
                    value={iso.organismName}
                    onChange={(e) => patchIsolate(idx, { organismName: e.target.value })}
                  />
                  <Input
                    label="Colony count"
                    placeholder=">100,000 CFU/mL"
                    value={iso.colonyCount}
                    onChange={(e) => patchIsolate(idx, { colonyCount: e.target.value })}
                  />
                  <Select
                    label="Significance"
                    options={SIGNIFICANCE.map((s) => ({ value: s, label: s.replace('_', ' ').toLowerCase() }))}
                    value={iso.significance}
                    onChange={(e) => patchIsolate(idx, { significance: e.target.value as OrganismSignificance })}
                  />
                </div>

                <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Antibiotic susceptibility
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead className="text-left text-xs uppercase text-muted">
                      <tr>
                        <th className="py-1 pr-2">Antibiotic</th>
                        <th className="py-1 pr-2">S / I / R</th>
                        <th className="py-1 pr-2">Zone (mm)</th>
                        <th className="py-1 pr-2">MIC</th>
                        <th className="py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {iso.susceptibilities.map((s, si) => (
                        <tr key={si} className="border-t border-border">
                          <td className="py-1 pr-2">
                            <Select
                              options={abOptions}
                              value={s.antibioticId ? String(s.antibioticId) : ''}
                              onChange={(e) => {
                                const id = e.target.value ? Number(e.target.value) : null;
                                const name = antibiotics.data?.find((a) => a.id === id)?.name ?? '';
                                patchSusc(idx, si, { antibioticId: id, antibioticName: name });
                              }}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <div className="flex gap-1">
                              {SIR.map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  title={SUSCEPTIBILITY_LABEL[v]}
                                  onClick={() => patchSusc(idx, si, { interpretation: v })}
                                  className={cn(
                                    'h-8 w-9 rounded text-xs font-semibold',
                                    s.interpretation === v
                                      ? SIR_TONE[v] + ' ring-2 ring-ring'
                                      : 'bg-surface-muted text-muted hover:bg-surface',
                                  )}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              className="h-8 w-20 rounded border border-input bg-surface px-2"
                              value={s.zone}
                              onChange={(e) => patchSusc(idx, si, { zone: e.target.value })}
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              className="h-8 w-24 rounded border border-input bg-surface px-2"
                              value={s.mic}
                              onChange={(e) => patchSusc(idx, si, { mic: e.target.value })}
                            />
                          </td>
                          <td className="py-1">
                            <button
                              type="button"
                              onClick={() =>
                                patchIsolate(idx, {
                                  susceptibilities: iso.susceptibilities.filter((_, j) => j !== si),
                                })
                              }
                              className="rounded p-1 text-muted hover:text-danger"
                              aria-label="Remove antibiotic"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    patchIsolate(idx, { susceptibilities: [...iso.susceptibilities, blankSusc()] })
                  }
                  className="mt-1.5 text-sm font-medium text-primary hover:underline"
                >
                  + Add antibiotic
                </button>

                <Input
                  label="Isolate note"
                  className="mt-3"
                  value={iso.note}
                  onChange={(e) => patchIsolate(idx, { note: e.target.value })}
                />
              </div>
            ))}

            <Button type="button" variant="secondary" size="sm" onClick={() => setIsolates((p) => [...p, blankIsolate()])}>
              <Plus className="h-4 w-4" aria-hidden />
              Add isolate
            </Button>
          </div>
        )}

        <Textarea
          label="Comment / interpretation"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <Button onClick={save} loading={saving}>
          Save culture result
        </Button>
      </CardBody>
    </Card>
  );
}
