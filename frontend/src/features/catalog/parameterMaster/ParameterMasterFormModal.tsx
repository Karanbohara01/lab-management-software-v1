import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { parameterMasterApi } from './api';
import { PARAMETER_DATA_TYPE_LABEL, type ParameterMaster } from './types';

const numish = z
  .union([z.coerce.number(), z.literal('')])
  .optional()
  .transform((v) => (v === '' || v == null ? null : Number(v)));

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(160),
  code: z.string().max(32).optional(),
  unit: z.string().max(32).optional(),
  dataType: z.enum(['NUMERIC', 'TEXT', 'CATEGORICAL', 'POSITIVE_NEGATIVE', 'REACTIVE_NONREACTIVE']),
  decimalPlaces: z.union([z.coerce.number().int().min(0), z.literal('')]).optional(),
  method: z.string().max(120).optional(),
  loincCode: z.string().max(20).optional(),
  groupHeading: z.string().max(120).optional(),
  allowedValues: z.string().max(500).optional(),
  lowValue: numish,
  highValue: numish,
  criticalLow: numish,
  criticalHigh: numish,
});
type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

const EMPTY: FormValues = {
  name: '',
  code: '',
  unit: '',
  dataType: 'NUMERIC',
  decimalPlaces: '',
  method: '',
  loincCode: '',
  groupHeading: '',
  allowedValues: '',
  lowValue: '',
  highValue: '',
  criticalLow: '',
  criticalHigh: '',
};

const DATA_TYPE_OPTIONS = Object.entries(PARAMETER_DATA_TYPE_LABEL).map(([value, label]) => ({ value, label }));

export function ParameterMasterFormModal({
  open,
  onClose,
  parameter,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parameter: ParameterMaster | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    if (parameter) {
      reset({
        name: parameter.name,
        code: parameter.code ?? '',
        unit: parameter.unit ?? '',
        dataType: parameter.dataType,
        decimalPlaces: parameter.decimalPlaces ?? '',
        method: parameter.method ?? '',
        loincCode: parameter.loincCode ?? '',
        groupHeading: parameter.groupHeading ?? '',
        allowedValues: parameter.allowedValues ?? '',
        lowValue: parameter.lowValue ?? '',
        highValue: parameter.highValue ?? '',
        criticalLow: parameter.criticalLow ?? '',
        criticalHigh: parameter.criticalHigh ?? '',
      });
    } else {
      reset(EMPTY);
    }
  }, [open, parameter, reset]);

  const dataType = watch('dataType');
  const isNumeric = dataType === 'NUMERIC';
  const isCategorical = dataType === 'CATEGORICAL';

  const onSubmit = handleSubmit(async (values) => {
    const v = values as ParsedValues;
    try {
      const payload = {
        name: v.name.trim(),
        code: v.code || undefined,
        unit: v.unit || undefined,
        dataType: v.dataType,
        decimalPlaces: v.decimalPlaces === '' || v.decimalPlaces == null ? null : Number(v.decimalPlaces),
        method: v.method || undefined,
        loincCode: v.loincCode || undefined,
        groupHeading: v.groupHeading || undefined,
        allowedValues: v.allowedValues || undefined,
        lowValue: v.lowValue,
        highValue: v.highValue,
        criticalLow: v.criticalLow,
        criticalHigh: v.criticalHigh,
      };
      if (parameter) {
        await parameterMasterApi.update(parameter.id, payload);
        toast.success('Parameter updated');
      } else {
        await parameterMasterApi.create(payload);
        toast.success('Parameter added to dictionary');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Unable to save parameter' });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={parameter ? `Edit parameter · ${parameter.name}` : 'New parameter'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="parameter-master-form" loading={isSubmitting}>
            {parameter ? 'Save changes' : 'Add parameter'}
          </Button>
        </>
      }
    >
      <form id="parameter-master-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" data-autofocus error={errors.name?.message} {...register('name')} />
          <Input label="Code" hint="Optional short code" {...register('code')} />
          <Input label="Unit" {...register('unit')} />
          <Select label="Type" options={DATA_TYPE_OPTIONS} {...register('dataType')} />
        </div>

        {isNumeric && (
          <fieldset className="rounded-md border border-border p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Typical adult reference range
            </legend>
            <div className="grid gap-3 sm:grid-cols-4">
              <Input label="Normal low" type="number" step="any" {...register('lowValue')} />
              <Input label="Normal high" type="number" step="any" {...register('highValue')} />
              <Input label="Critical low" type="number" step="any" {...register('criticalLow')} />
              <Input label="Critical high" type="number" step="any" {...register('criticalHigh')} />
            </div>
            <Input label="Decimal places" type="number" min={0} className="mt-3" {...register('decimalPlaces')} />
          </fieldset>
        )}

        {isCategorical && (
          <Input
            label="Allowed values"
            placeholder="Nil | Trace | 1+ | 2+ | 3+"
            hint="Separate the options with a vertical bar ( | )"
            {...register('allowedValues')}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Group heading" placeholder="e.g. Differential count" {...register('groupHeading')} />
          <Input label="Method / analyzer" {...register('method')} />
          <Input label="LOINC code" {...register('loincCode')} />
        </div>
        <p className="text-xs text-muted">
          Values entered here are only defaults offered when adding a parameter to a test — editing this later
          does not change any test that already used it.
        </p>
      </form>
    </Modal>
  );
}
