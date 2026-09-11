import { useEffect, useMemo, useState } from 'react';
import {
  useForm,
  useFieldArray,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import type { Department } from '@/features/departments/api';
import { testCatalogApi } from './api';
import { ANALYTE_PRESETS, UNIT_OPTIONS, findAnalytePreset } from './analytePresets';
import {
  AGE_UNIT_LABELS,
  DATA_TYPE_LABELS,
  SPECIMEN_LABELS,
  type TestDetail,
  type TestUpsertPayload,
} from './types';

const numish = z
  .union([z.coerce.number(), z.literal('')])
  .optional()
  .transform((v) => (v === '' || v == null ? null : Number(v)));

const intish = z
  .union([z.coerce.number().int(), z.literal('')])
  .optional()
  .transform((v) => (v === '' || v == null ? null : Number(v)));

const paramSchema = z.object({
  code: z.string().max(32).optional(),
  name: z.string().min(1, 'Parameter name required').max(160),
  unit: z.string().max(32).optional(),
  dataType: z.enum(['NUMERIC', 'TEXT', 'CATEGORICAL', 'POSITIVE_NEGATIVE', 'REACTIVE_NONREACTIVE']),
  groupHeading: z.string().max(120).optional(),
  method: z.string().max(120).optional(),
  decimalPlaces: intish,
  calculationFormula: z.string().max(500).optional(),
  allowedValues: z.string().max(500).optional(),
  absurdLow: numish,
  absurdHigh: numish,
  deltaCheckPercent: numish,
  low: numish,
  high: numish,
  criticalLow: numish,
  criticalHigh: numish,
  normalText: z.string().max(120).optional(),
  ageLow: intish,
  ageHigh: intish,
  ageUnit: z.enum(['YEARS', 'MONTHS', 'DAYS']),
  gender: z.enum(['ALL', 'MALE', 'FEMALE']),
});

const schema = z.object({
  code: z.string().min(1, 'Code is required').max(32).regex(/^[A-Za-z0-9._-]+$/, 'Letters, digits, . - _ only'),
  name: z.string().min(1, 'Name is required').max(160),
  type: z.enum(['ANALYTE', 'PROFILE']),
  resultMode: z.enum(['PARAMETRIC', 'CULTURE']),
  departmentId: z.string().min(1, 'Select a department'),
  category: z.string().max(80).optional(),
  specimenType: z.string().min(1),
  specimenRequirements: z.string().max(500).optional(),
  method: z.string().max(120).optional(),
  loincCode: z.string().max(20).optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  turnaroundHours: z.union([z.coerce.number().int().min(0), z.literal('')]).optional(),
  containerType: z.string().max(60).optional(),
  minVolumeMl: numish,
  stabilityNote: z.string().max(300).optional(),
  autoVerifyEnabled: z.boolean(),
  fastingRequired: z.boolean(),
  fastingHours: intish,
  referral: z.boolean(),
  referralLab: z.string().max(160).optional(),
  parameters: z.array(paramSchema),
});

type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

const emptyParam: FormValues['parameters'][number] = {
  code: '',
  name: '',
  unit: '',
  dataType: 'NUMERIC',
  groupHeading: '',
  method: '',
  decimalPlaces: '',
  calculationFormula: '',
  allowedValues: '',
  absurdLow: '',
  absurdHigh: '',
  deltaCheckPercent: '',
  low: '',
  high: '',
  criticalLow: '',
  criticalHigh: '',
  normalText: '',
  ageLow: '',
  ageHigh: '',
  ageUnit: 'YEARS',
  gender: 'ALL',
};

const EMPTY: FormValues = {
  code: '',
  name: '',
  type: 'ANALYTE',
  resultMode: 'PARAMETRIC',
  departmentId: '',
  category: '',
  specimenType: 'BLOOD_SERUM',
  specimenRequirements: '',
  method: '',
  loincCode: '',
  price: 0,
  turnaroundHours: '',
  containerType: '',
  minVolumeMl: '',
  stabilityNote: '',
  autoVerifyEnabled: false,
  fastingRequired: false,
  fastingHours: '',
  referral: false,
  referralLab: '',
  parameters: [],
};

const DATA_TYPE_OPTIONS = Object.entries(DATA_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const AGE_UNIT_OPTIONS = Object.entries(AGE_UNIT_LABELS).map(([value, label]) => ({ value, label }));
const GENDER_OPTIONS = [
  { value: 'ALL', label: 'All patients' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

/** One collapsible parameter editor row. Collapsed shows a summary; expanded groups fields by purpose. */
function ParameterRow({
  index,
  register,
  errors,
  param,
  setValue,
  onRemove,
}: {
  index: number;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  param: FormValues['parameters'][number] | undefined;
  setValue: UseFormSetValue<FormValues>;
  onRemove: () => void;
}) {
  const name = param?.name?.trim();

  const applyPreset = (typed: string) => {
    const preset = findAnalytePreset(typed);
    if (!preset) return;
    const empty = (v: unknown) => v === '' || v == null;
    const put = (key: keyof FormValues['parameters'][number], value: string | number) =>
      setValue(`parameters.${index}.${key}` as 'parameters.0.name', String(value) as never, {
        shouldDirty: true,
      });
    put('name', preset.name);
    if (empty(param?.code)) put('code', preset.code);
    if (empty(param?.unit)) put('unit', preset.unit);
    if (empty(param?.decimalPlaces) && preset.decimalPlaces != null) put('decimalPlaces', preset.decimalPlaces);
    if (empty(param?.groupHeading) && preset.group) put('groupHeading', preset.group);
    if (empty(param?.low) && preset.low != null) put('low', preset.low);
    if (empty(param?.high) && preset.high != null) put('high', preset.high);
    if (empty(param?.criticalLow) && preset.criticalLow != null) put('criticalLow', preset.criticalLow);
    if (empty(param?.criticalHigh) && preset.criticalHigh != null) put('criticalHigh', preset.criticalHigh);
  };
  const [open, setOpen] = useState(() => !name);
  const dataType = param?.dataType ?? 'NUMERIC';
  const isNumeric = dataType === 'NUMERIC';
  const isCategorical = dataType === 'CATEGORICAL';
  const isCalc = !!param?.calculationFormula?.trim();
  const bandActive =
    (!!param?.gender && param.gender !== 'ALL') ||
    (param?.ageLow !== '' && param?.ageLow != null) ||
    (param?.ageHigh !== '' && param?.ageHigh != null);
  const [showBand, setShowBand] = useState(bandActive);
  const err = errors.parameters?.[index];
  const field = (k: keyof FormValues['parameters'][number]) => `parameters.${index}.${k}` as const;

  const summary = [
    DATA_TYPE_LABELS[dataType],
    param?.unit || null,
    isNumeric && !isCalc && (param?.low !== '' || param?.high !== '')
      ? `${param?.low || '…'}–${param?.high || '…'}`
      : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <li className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn('h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-90')}
            aria-hidden
          />
          <span className="shrink-0 text-sm font-medium text-foreground">
            {name || `Parameter ${index + 1}`}
          </span>
          {isCalc && <Badge tone="info">calculated</Badge>}
          {!open && summary && <span className="truncate text-xs text-muted">{summary}</span>}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted hover:text-danger"
          aria-label={`Remove parameter ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-border px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              label="Name"
              list="lab-analyte-options"
              placeholder="Type or pick…"
              error={err?.name?.message}
              {...register(field('name'), {
                onChange: (e) => applyPreset(e.target.value),
              })}
            />
            <Input label="Code" hint="Used in formulas" {...register(field('code'))} />
            <Input label="Unit" list="lab-unit-options" placeholder="Type or pick…" {...register(field('unit'))} />
            <Select label="Type" options={DATA_TYPE_OPTIONS} {...register(field('dataType'))} />
          </div>

          {isNumeric && isCalc && (
            <p className="rounded-md bg-primary/5 px-3 py-2 text-xs text-muted">
              Calculated parameter — its value comes from the formula in Advanced; no manual entry or
              reference range.
            </p>
          )}

          {isNumeric && !isCalc && (
            <fieldset className="rounded-md border border-border p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Reference range
              </legend>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input label="Normal low" type="number" step="any" {...register(field('low'))} />
                <Input label="Normal high" type="number" step="any" {...register(field('high'))} />
                <Input label="Critical low" type="number" step="any" {...register(field('criticalLow'))} />
                <Input label="Critical high" type="number" step="any" {...register(field('criticalHigh'))} />
              </div>
              {showBand ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <Select label="Applies to" options={GENDER_OPTIONS} {...register(field('gender'))} />
                  <Input label="Age from" type="number" min={0} {...register(field('ageLow'))} />
                  <Input label="Age to" type="number" min={0} {...register(field('ageHigh'))} />
                  <Select label="Age unit" options={AGE_UNIT_OPTIONS} {...register(field('ageUnit'))} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBand(true)}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  + Age / sex-specific range
                </button>
              )}
            </fieldset>
          )}

          {isCategorical && (
            <Input
              label="Allowed values"
              placeholder="Nil | Trace | 1+ | 2+ | 3+"
              hint="Separate the options with a vertical bar ( | )"
              {...register(field('allowedValues'))}
            />
          )}

          {!isNumeric && !isCategorical && (
            <Input
              label="Normal / expected result"
              placeholder="e.g. Negative, Nil, Clear"
              {...register(field('normalText'))}
            />
          )}

          <details className="group rounded-md border border-border px-3 py-2">
            <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted">
              <ChevronRight className="mr-1 inline h-3 w-3 transition-transform group-open:rotate-90" aria-hidden />
              Advanced — grouping, formula, plausibility, delta
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Group heading" placeholder="e.g. Differential count" {...register(field('groupHeading'))} />
                <Input label="Method / analyzer" {...register(field('method'))} />
              </div>
              {isNumeric && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Decimal places" type="number" min={0} {...register(field('decimalPlaces'))} />
                  <Input
                    label="Formula"
                    placeholder="e.g. TC - HDL - TG/5"
                    hint="Arithmetic over other parameter codes"
                    {...register(field('calculationFormula'))}
                  />
                  <Input
                    label="Plausible min"
                    type="number"
                    step="any"
                    hint="Reject values below this"
                    {...register(field('absurdLow'))}
                  />
                  <Input
                    label="Plausible max"
                    type="number"
                    step="any"
                    hint="Reject values above this"
                    {...register(field('absurdHigh'))}
                  />
                  <Input
                    label="Delta check %"
                    type="number"
                    step="any"
                    hint="Flag if change vs the previous result exceeds this"
                    {...register(field('deltaCheckPercent'))}
                  />
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </li>
  );
}

function buildPayload(v: ParsedValues, memberIds: number[]): TestUpsertPayload {
  return {
    code: v.code.trim().toUpperCase(),
    name: v.name.trim(),
    type: v.type,
    resultMode: v.resultMode,
    departmentId: Number(v.departmentId),
    category: v.category || undefined,
    specimenType: v.specimenType as TestUpsertPayload['specimenType'],
    specimenRequirements: v.specimenRequirements || undefined,
    method: v.method || undefined,
    loincCode: v.loincCode || undefined,
    price: v.price.toFixed(2),
    turnaroundHours: v.turnaroundHours === '' || v.turnaroundHours == null ? null : Number(v.turnaroundHours),
    specimenHandling: {
      containerType: v.containerType || null,
      minVolumeMl: v.minVolumeMl,
      stabilityNote: v.stabilityNote || null,
      fastingRequired: v.fastingRequired,
      fastingHours: v.fastingHours,
      referral: v.referral,
      referralLab: v.referralLab || null,
    },
    autoVerifyEnabled: v.autoVerifyEnabled,
    memberTestIds: v.type === 'PROFILE' ? memberIds : [],
    parameters:
      v.type === 'PROFILE' || v.resultMode === 'CULTURE'
        ? []
        : v.parameters.map((p, index) => {
            const isNumeric = p.dataType === 'NUMERIC';
            const hasRange =
              (isNumeric && (p.low != null || p.high != null || p.criticalLow != null || p.criticalHigh != null)) ||
              (!isNumeric && !!p.normalText);
            return {
              code: p.code || undefined,
              name: p.name.trim(),
              unit: p.unit || undefined,
              dataType: p.dataType,
              displayOrder: index + 1,
              decimalPlaces: p.decimalPlaces,
              calculationFormula: p.calculationFormula || undefined,
              allowedValues: p.allowedValues || undefined,
              absurdLow: p.absurdLow,
              absurdHigh: p.absurdHigh,
              method: p.method || undefined,
              groupHeading: p.groupHeading || undefined,
              deltaCheckPercent: p.deltaCheckPercent,
              referenceRanges: hasRange
                ? [
                    {
                      appliesToGender: p.gender,
                      ageLow: p.ageLow,
                      ageHigh: p.ageHigh,
                      ageUnit: p.ageUnit,
                      appliesToPregnant: false,
                      effectiveFrom: null,
                      source: null,
                      lowValue: isNumeric ? p.low : null,
                      highValue: isNumeric ? p.high : null,
                      normalText: isNumeric ? null : p.normalText || null,
                      criticalLow: isNumeric ? p.criticalLow : null,
                      criticalHigh: isNumeric ? p.criticalHigh : null,
                    },
                  ]
                : [],
            };
          }),
  };
}

export function TestFormModal({
  open,
  onClose,
  test,
  departments,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  test: TestDetail | null;
  departments: Department[];
  onSaved: () => void;
}) {
  const toast = useToast();
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const allTests = useQuery(() => testCatalogApi.list({ activeOnly: true, size: 500 }), [open]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const { fields, append, remove } = useFieldArray({ control, name: 'parameters' });

  useEffect(() => {
    if (!open) return;
    if (test) {
      setMemberIds(test.members.map((m) => m.id));
      reset({
        code: test.code,
        name: test.name,
        type: test.type,
        resultMode: test.resultMode ?? 'PARAMETRIC',
        departmentId: String(test.departmentId),
        category: test.category ?? '',
        specimenType: test.specimenType,
        specimenRequirements: test.specimenRequirements ?? '',
        method: test.method ?? '',
        loincCode: test.loincCode ?? '',
        price: test.price,
        turnaroundHours: test.turnaroundHours ?? '',
        containerType: test.specimenHandling.containerType ?? '',
        minVolumeMl: test.specimenHandling.minVolumeMl ?? '',
        stabilityNote: test.specimenHandling.stabilityNote ?? '',
        autoVerifyEnabled: test.autoVerifyEnabled,
        fastingRequired: test.specimenHandling.fastingRequired,
        fastingHours: test.specimenHandling.fastingHours ?? '',
        referral: test.specimenHandling.referral,
        referralLab: test.specimenHandling.referralLab ?? '',
        parameters: test.parameters.map((p) => {
          const r = p.referenceRanges[0];
          return {
            code: p.code ?? '',
            name: p.name,
            unit: p.unit ?? '',
            dataType: p.dataType,
            groupHeading: p.groupHeading ?? '',
            method: p.method ?? '',
            decimalPlaces: p.decimalPlaces ?? '',
            calculationFormula: p.calculationFormula ?? '',
            allowedValues: p.allowedValues ?? '',
            absurdLow: p.absurdLow ?? '',
            absurdHigh: p.absurdHigh ?? '',
            deltaCheckPercent: p.deltaCheckPercent ?? '',
            low: r?.lowValue ?? '',
            high: r?.highValue ?? '',
            criticalLow: r?.criticalLow ?? '',
            criticalHigh: r?.criticalHigh ?? '',
            normalText: r?.normalText ?? '',
            ageLow: r?.ageLow ?? '',
            ageHigh: r?.ageHigh ?? '',
            ageUnit: r?.ageUnit ?? 'YEARS',
            gender: r?.appliesToGender ?? 'ALL',
          };
        }),
      });
    } else {
      setMemberIds([]);
      reset(EMPTY);
    }
  }, [open, test, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = values as ParsedValues;
    if (parsed.type === 'PROFILE' && memberIds.length === 0) {
      setError('root', { message: 'Add at least one member test to the profile.' });
      return;
    }
    try {
      const payload = buildPayload(parsed, memberIds);
      if (test) {
        const { code: _code, ...rest } = payload;
        await testCatalogApi.update(test.id, rest);
        toast.success('Test updated');
      } else {
        await testCatalogApi.create(payload);
        toast.success('Test added to catalog');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Unable to save test' });
    }
  });

  const deptOptions = departments.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }));
  const specimenOptions = Object.entries(SPECIMEN_LABELS).map(([value, label]) => ({ value, label }));
  const params = watch('parameters');
  const type = watch('type');
  const resultMode = watch('resultMode');
  const isCulture = resultMode === 'CULTURE';
  const fasting = watch('fastingRequired');
  const referral = watch('referral');

  const memberOptions = useMemo(
    () =>
      (allTests.data?.content ?? [])
        .filter((t) => t.type === 'ANALYTE' && t.id !== test?.id)
        .filter((t) =>
          memberSearch
            ? `${t.code} ${t.name}`.toLowerCase().includes(memberSearch.toLowerCase())
            : true,
        ),
    [allTests.data, memberSearch, test?.id],
  );
  const selectedMembers = (allTests.data?.content ?? []).filter((t) => memberIds.includes(t.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={test ? `Edit test · ${test.code}` : 'New test'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="test-form" loading={isSubmitting}>
            {test ? 'Save changes' : 'Add test'}
          </Button>
        </>
      }
    >
      <form id="test-form" onSubmit={onSubmit} className="space-y-5" noValidate>
        <datalist id="lab-unit-options">
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <datalist id="lab-analyte-options">
          {ANALYTE_PRESETS.map((p) => (
            <option key={p.code} value={p.name} />
          ))}
        </datalist>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}

        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Test details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Code" disabled={!!test} error={errors.code?.message} {...register('code')} />
          <Input label="Test name" data-autofocus error={errors.name?.message} {...register('name')} />
          <Select
            label="Type"
            options={[
              { value: 'ANALYTE', label: 'Analyte — measured test with parameters' },
              { value: 'PROFILE', label: 'Profile / panel — bundle of member tests' },
            ]}
            {...register('type')}
          />
          {type === 'ANALYTE' && (
            <Select
              label="Result entry"
              options={[
                { value: 'PARAMETRIC', label: 'Parametric — one value per parameter' },
                { value: 'CULTURE', label: 'Culture — microbiology growth + sensitivity' },
              ]}
              {...register('resultMode')}
            />
          )}
          <Select label="Department" options={deptOptions} placeholder="Select…" error={errors.departmentId?.message} {...register('departmentId')} />
          <Input label="Category" {...register('category')} />
          <Select label="Specimen type" options={specimenOptions} {...register('specimenType')} />
          <Input label="Method" {...register('method')} />
          <Input label="LOINC code" {...register('loincCode')} />
          <Input label="Price (NPR)" type="number" step="0.01" min={0} error={errors.price?.message} {...register('price')} />
          <Input label="Turnaround (hours)" type="number" min={0} {...register('turnaroundHours')} />
        </div>

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Specimen &amp; handling</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input label="Container / tube" placeholder="e.g. Lavender EDTA" {...register('containerType')} />
            <Input label="Min volume (mL)" type="number" step="any" {...register('minVolumeMl')} />
            <Input label="Stability" placeholder="e.g. 24h at 2–8°C" {...register('stabilityNote')} />
            <Checkbox label="Fasting required" {...register('fastingRequired')} />
            {fasting && <Input label="Fasting hours" type="number" min={0} {...register('fastingHours')} />}
            <Checkbox label="Send-away (referral) test" {...register('referral')} />
            {referral && <Input label="Reference laboratory" {...register('referralLab')} />}
          </div>
          <Textarea label="Specimen requirements / instructions" className="mt-3" {...register('specimenRequirements')} />
          <Checkbox
            className="mt-3"
            label="Auto-verify normal results"
            hint="A fully-normal, in-range result with no delta breach is verified automatically"
            {...register('autoVerifyEnabled')}
          />
        </details>

        {type === 'PROFILE' ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Member tests</h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedMembers.map((m) => (
                <Badge key={m.id} tone="info">
                  {m.code}
                  <button type="button" onClick={() => setMemberIds((ids) => ids.filter((i) => i !== m.id))} aria-label={`Remove ${m.code}`}>
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </Badge>
              ))}
              {selectedMembers.length === 0 && <span className="text-sm text-muted">No member tests yet.</span>}
            </div>
            <Input placeholder="Search tests to add…" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            {memberSearch && (
              <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border">
                {memberOptions.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={memberIds.includes(t.id)}
                      onClick={() => {
                        setMemberIds((ids) => [...ids, t.id]);
                        setMemberSearch('');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted disabled:opacity-40"
                    >
                      <span className="font-mono text-xs text-muted">{t.code}</span>
                      {t.name}
                      <span className="ml-auto text-xs text-muted">{t.departmentName}</span>
                    </button>
                  </li>
                ))}
                {memberOptions.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matching analyte tests.</li>}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted">
              Ordering this profile bills the price above and produces results for each member test.
            </p>
          </div>
        ) : isCulture ? (
          <Alert tone="info" title="Culture & sensitivity test">
            Results are entered as a growth outcome plus, when organisms are isolated, an antibiotic
            susceptibility panel per isolate — configured on the result screen, not here. No parameters
            are needed.
          </Alert>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Parameters</h3>
                <p className="text-xs text-muted">
                  {fields.length === 0
                    ? 'A test can report a single value or several parameters.'
                    : `${fields.length} parameter${fields.length === 1 ? '' : 's'} — click a row to expand.`}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => append(emptyParam)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add parameter
              </Button>
            </div>

            {fields.length === 0 ? (
              <button
                type="button"
                onClick={() => append(emptyParam)}
                className="w-full rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted hover:border-primary hover:text-primary"
              >
                + Add the first parameter
              </button>
            ) : (
              <ul className="space-y-2">
                {fields.map((field, index) => (
                  <ParameterRow
                    key={field.id}
                    index={index}
                    register={register}
                    errors={errors}
                    param={params?.[index]}
                    setValue={setValue}
                    onRemove={() => remove(index)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
