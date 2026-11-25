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
import { Modal, ModalCancelButton } from '@/components/ui/Modal';
import { useIsDirty } from '@/hooks/useUnsavedChanges';
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
import { UNIT_OPTIONS } from './analytePresets';
import { parameterMasterApi } from './parameterMaster/api';
import type { ParameterMaster } from './parameterMaster/types';
import {
  AGE_UNIT_LABELS,
  DATA_TYPE_LABELS,
  SPECIMEN_LABELS,
  type TestDetail,
  type TestUpsertPayload,
} from './types';
import { useT, tOpts } from '@/i18n';

const numish = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.coerce.number().nullable(),
);

const intish = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.coerce.number().int().nullable(),
);

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
  presetsByName,
}: {
  index: number;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  param: FormValues['parameters'][number] | undefined;
  setValue: UseFormSetValue<FormValues>;
  onRemove: () => void;
  presetsByName: Map<string, ParameterMaster>;
}) {
  const t = useT();
  const name = param?.name?.trim();

  const applyPreset = (typed: string) => {
    const preset = presetsByName.get(typed.trim().toLowerCase());
    if (!preset) return;
    const empty = (v: unknown) => v === '' || v == null;
    const put = (key: keyof FormValues['parameters'][number], value: string | number) =>
      setValue(`parameters.${index}.${key}` as 'parameters.0.name', String(value) as never, {
        shouldDirty: true,
      });
    put('name', preset.name);
    if (empty(param?.code) && preset.code) put('code', preset.code);
    if (empty(param?.unit) && preset.unit) put('unit', preset.unit);
    if (empty(param?.decimalPlaces) && preset.decimalPlaces != null) put('decimalPlaces', preset.decimalPlaces);
    if (empty(param?.groupHeading) && preset.groupHeading) put('groupHeading', preset.groupHeading);
    if (empty(param?.method) && preset.method) put('method', preset.method);
    if (empty(param?.allowedValues) && preset.allowedValues) put('allowedValues', preset.allowedValues);
    if (empty(param?.low) && preset.lowValue != null) put('low', preset.lowValue);
    if (empty(param?.high) && preset.highValue != null) put('high', preset.highValue);
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
    t(DATA_TYPE_LABELS[dataType]),
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
            {name || t('Parameter {n}', { n: index + 1 })}
          </span>
          {isCalc && <Badge tone="info">{t('calculated')}</Badge>}
          {!open && summary && <span className="truncate text-xs text-muted">{summary}</span>}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted hover:text-danger"
          aria-label={t('Remove parameter {n}', { n: index + 1 })}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-border px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              label={t('Name')}
              list="lab-analyte-options"
              placeholder={t('Type or pick…')}
              error={err?.name?.message}
              {...register(field('name'), {
                onChange: (e) => applyPreset(e.target.value),
              })}
            />
            <Input label={t('Code')} hint={t('Used in formulas')} {...register(field('code'))} />
            <Input label={t('Unit')} list="lab-unit-options" placeholder={t('Type or pick…')} {...register(field('unit'))} />
            <Select label={t('Type')} options={tOpts(DATA_TYPE_OPTIONS)} {...register(field('dataType'))} />
          </div>

          {isNumeric && isCalc && (
            <p className="rounded-md bg-primary/5 px-3 py-2 text-xs text-muted">
              {t(
                'Calculated parameter — its value comes from the formula in Advanced; no manual entry or reference range.',
              )}
            </p>
          )}

          {isNumeric && !isCalc && (
            <fieldset className="rounded-md border border-border p-3">
              <legend className="px-1 text-label uppercase text-muted">
                {t('Reference range')}
              </legend>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input label={t('Normal low')} type="number" step="any" {...register(field('low'))} />
                <Input label={t('Normal high')} type="number" step="any" {...register(field('high'))} />
                <Input label={t('Critical low')} type="number" step="any" {...register(field('criticalLow'))} />
                <Input label={t('Critical high')} type="number" step="any" {...register(field('criticalHigh'))} />
              </div>
              {showBand ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <Select label={t('Applies to')} options={tOpts(GENDER_OPTIONS)} {...register(field('gender'))} />
                  <Input label={t('Age from')} type="number" min={0} {...register(field('ageLow'))} />
                  <Input label={t('Age to')} type="number" min={0} {...register(field('ageHigh'))} />
                  <Select label={t('Age unit')} options={tOpts(AGE_UNIT_OPTIONS)} {...register(field('ageUnit'))} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBand(true)}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  {t('+ Age / sex-specific range')}
                </button>
              )}
            </fieldset>
          )}

          {isCategorical && (
            <Input
              label={t('Allowed values')}
              placeholder="Nil | Trace | 1+ | 2+ | 3+"
              hint={t('Separate the options with a vertical bar ( | )')}
              {...register(field('allowedValues'))}
            />
          )}

          {!isNumeric && !isCategorical && (
            <Input
              label={t('Normal / expected result')}
              placeholder="e.g. Negative, Nil, Clear"
              {...register(field('normalText'))}
            />
          )}

          <details className="group rounded-md border border-border px-3 py-2">
            <summary className="cursor-pointer list-none text-label uppercase text-muted">
              <ChevronRight className="mr-1 inline h-3 w-3 transition-transform group-open:rotate-90" aria-hidden />
              {t('Advanced — grouping, formula, plausibility, delta')}
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={t('Group heading')} placeholder="e.g. Differential count" {...register(field('groupHeading'))} />
                <Input label={t('Method / analyzer')} {...register(field('method'))} />
              </div>
              {isNumeric && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label={t('Decimal places')} type="number" min={0} {...register(field('decimalPlaces'))} />
                  <Input
                    label={t('Formula')}
                    placeholder="e.g. TC - HDL - TG/5"
                    hint={t('Arithmetic over other parameter codes')}
                    {...register(field('calculationFormula'))}
                  />
                  <Input
                    label={t('Plausible min')}
                    type="number"
                    step="any"
                    hint={t('Reject values below this')}
                    {...register(field('absurdLow'))}
                  />
                  <Input
                    label={t('Plausible max')}
                    type="number"
                    step="any"
                    hint={t('Reject values above this')}
                    {...register(field('absurdHigh'))}
                  />
                  <Input
                    label={t('Delta check %')}
                    type="number"
                    step="any"
                    hint={t('Flag if change vs the previous result exceeds this')}
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
  const t = useT();
  const toast = useToast();
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const allTests = useQuery(() => testCatalogApi.list({ activeOnly: true, size: 500 }), [open]);
  const parameterPresets = useQuery(() => parameterMasterApi.list({ activeOnly: true, size: 500 }), [open]);
  const presetsByName = useMemo(
    () => new Map((parameterPresets.data?.content ?? []).map((p) => [p.name.toLowerCase(), p])),
    [parameterPresets.data],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
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
      setError('root', { message: t('Add at least one member test to the profile.') });
      return;
    }
    try {
      const payload = buildPayload(parsed, memberIds);
      if (test) {
        const { code: _code, ...rest } = payload;
        await testCatalogApi.update(test.id, rest);
        toast.success(t('Test updated'));
      } else {
        await testCatalogApi.create(payload);
        toast.success(t('Test added to catalog'));
      }
      onSaved();
      onClose();
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : t('Unable to save test') });
    }
  });

  // The profile's member tests live outside react-hook-form, so they need their own comparison.
  const memberBaseline = useMemo(() => (test ? test.members.map((m) => m.id) : []), [test]);
  const membersChanged = useIsDirty(memberIds, memberBaseline);

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
        .filter((tst) => tst.type === 'ANALYTE' && tst.id !== test?.id)
        .filter((tst) =>
          memberSearch
            ? `${tst.code} ${tst.name}`.toLowerCase().includes(memberSearch.toLowerCase())
            : true,
        ),
    [allTests.data, memberSearch, test?.id],
  );
  const selectedMembers = (allTests.data?.content ?? []).filter((tst) => memberIds.includes(tst.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={test ? t('Edit test · {code}', { code: test.code }) : t('New test')}
      size="xl"
      confirmClose={(isDirty || membersChanged) && !isSubmitting}
      footer={
        <>
          <ModalCancelButton />
          <Button type="submit" form="test-form" loading={isSubmitting}>
            {test ? t('Save changes') : t('Add test')}
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
          {(parameterPresets.data?.content ?? []).map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}

        <h3 className="text-label uppercase text-muted">{t('Test details')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('Code')}
            placeholder={t('e.g. CBC, LFT, TSH')}
            hint={t("Unique — letters, digits, . - _ only. Can't be changed later.")}
            disabled={!!test}
            error={errors.code?.message}
            {...register('code')}
          />
          <Input label={t('Test name')} data-autofocus error={errors.name?.message} {...register('name')} />
          <Select
            label={t('Type')}
            options={[
              { value: 'ANALYTE', label: t('Analyte — measured test with parameters') },
              { value: 'PROFILE', label: t('Profile / panel — bundle of member tests') },
            ]}
            {...register('type')}
          />
          {type === 'ANALYTE' && (
            <Select
              label={t('Result entry')}
              options={[
                { value: 'PARAMETRIC', label: t('Parametric — one value per parameter') },
                { value: 'CULTURE', label: t('Culture — microbiology growth + sensitivity') },
              ]}
              {...register('resultMode')}
            />
          )}
          <Select label={t('Department')} options={deptOptions} placeholder={t('Select…')} error={errors.departmentId?.message} {...register('departmentId')} />
          <Input
            label={t('Category')}
            placeholder={t('e.g. Renal panel, Diabetes workup')}
            hint={t('Optional grouping label for your own reference')}
            {...register('category')}
          />
          <Select label={t('Specimen type')} options={tOpts(specimenOptions)} {...register('specimenType')} />
          <Input label={t('Method')} placeholder={t('e.g. ELISA, Flow cytometry, Automated analyser')} {...register('method')} />
          <Input
            label={t('LOINC code')}
            placeholder={t('e.g. 2345-7')}
            hint={t('Standard lab-test identifier (loinc.org) — optional')}
            {...register('loincCode')}
          />
          <Input label={t('Price (NPR)')} type="number" step="0.01" min={0} error={errors.price?.message} {...register('price')} />
          <Input
            label={t('Turnaround (hours)')}
            type="number"
            min={0}
            hint={t('Leave blank for no turnaround deadline on results')}
            {...register('turnaroundHours')}
          />
        </div>

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">{t('Specimen & handling')}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input label={t('Container / tube')} placeholder="e.g. Lavender EDTA" {...register('containerType')} />
            <Input label={t('Min volume (mL)')} type="number" step="any" {...register('minVolumeMl')} />
            <Input label={t('Stability')} placeholder="e.g. 24h at 2–8°C" {...register('stabilityNote')} />
            <Checkbox label={t('Fasting required')} {...register('fastingRequired')} />
            {fasting && <Input label={t('Fasting hours')} type="number" min={0} {...register('fastingHours')} />}
            <Checkbox label={t('Send-away (referral) test')} {...register('referral')} />
            {referral && <Input label={t('Reference laboratory')} {...register('referralLab')} />}
          </div>
          <Textarea label={t('Specimen requirements / instructions')} className="mt-3" {...register('specimenRequirements')} />
          <Checkbox
            className="mt-3"
            label={t('Auto-verify normal results')}
            hint={t('A fully-normal, in-range result with no delta breach is verified automatically')}
            {...register('autoVerifyEnabled')}
          />
        </details>

        {type === 'PROFILE' ? (
          <div>
            <h3 className="mb-2 text-label uppercase text-muted">{t('Member tests')}</h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedMembers.map((m) => (
                <Badge key={m.id} tone="info">
                  {m.code}
                  <button type="button" onClick={() => setMemberIds((ids) => ids.filter((i) => i !== m.id))} aria-label={t('Remove {code}', { code: m.code })}>
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </Badge>
              ))}
              {selectedMembers.length === 0 && <span className="text-sm text-muted">{t('No member tests yet.')}</span>}
            </div>
            <Input placeholder={t('Search tests to add…')} value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            {memberSearch && (
              <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border">
                {memberOptions.map((tst) => (
                  <li key={tst.id}>
                    <button
                      type="button"
                      disabled={memberIds.includes(tst.id)}
                      onClick={() => {
                        setMemberIds((ids) => [...ids, tst.id]);
                        setMemberSearch('');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted disabled:opacity-40"
                    >
                      <span className="font-mono text-xs text-muted">{tst.code}</span>
                      {tst.name}
                      <span className="ml-auto text-xs text-muted">{tst.departmentName}</span>
                    </button>
                  </li>
                ))}
                {memberOptions.length === 0 && <li className="px-3 py-2 text-sm text-muted">{t('No matching analyte tests.')}</li>}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted">
              {t('Ordering this profile bills the price above and produces results for each member test.')}
            </p>
          </div>
        ) : isCulture ? (
          <Alert tone="info" title={t('Culture & sensitivity test')}>
            {t(
              'Results are entered as a growth outcome plus, when organisms are isolated, an antibiotic susceptibility panel per isolate — configured on the result screen, not here. No parameters are needed.',
            )}
          </Alert>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-label uppercase text-muted">{t('Parameters')}</h3>
                <p className="text-xs text-muted">
                  {fields.length === 0
                    ? t('A test can report a single value or several parameters.')
                    : t(
                        fields.length === 1
                          ? '{count} parameter — click a row to expand.'
                          : '{count} parameters — click a row to expand.',
                        { count: fields.length },
                      )}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => append(emptyParam)}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('Add parameter')}
              </Button>
            </div>

            {fields.length === 0 ? (
              <button
                type="button"
                onClick={() => append(emptyParam)}
                className="w-full rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted hover:border-primary hover:text-primary"
              >
                {t('+ Add the first parameter')}
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
                    presetsByName={presetsByName}
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
