import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { DATA_TYPE_LABELS, SPECIMEN_LABELS } from '../types';
import { masterCatalogAdminApi } from './api';
import type { MasterTestDetail } from './types';

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
  name: z.string().min(1, 'Required').max(160),
  unit: z.string().max(32).optional(),
  dataType: z.enum(['NUMERIC', 'TEXT', 'CATEGORICAL', 'POSITIVE_NEGATIVE', 'REACTIVE_NONREACTIVE']),
  decimalPlaces: intish,
  groupHeading: z.string().max(120).optional(),
  low: numish,
  high: numish,
  criticalLow: numish,
  criticalHigh: numish,
});

const schema = z.object({
  code: z.string().min(1, 'Required').max(32),
  name: z.string().min(1, 'Required').max(160),
  departmentName: z.string().min(1, 'Required').max(120),
  category: z.string().max(80).optional(),
  specimenType: z.string().min(1),
  suggestedPrice: z.coerce.number().min(0),
  turnaroundHours: intish,
  displayOrder: z.coerce.number().int().default(0),
  active: z.boolean(),
  parameters: z.array(paramSchema),
});
type FormValues = z.infer<typeof schema>;

const SPECIMEN_OPTIONS = Object.entries(SPECIMEN_LABELS).map(([value, label]) => ({ value, label }));
const DATA_TYPE_OPTIONS = Object.entries(DATA_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function MasterTestFormModal({
  open,
  onClose,
  test,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  test: MasterTestDetail | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isEdit = !!test;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      departmentName: '',
      specimenType: 'BLOOD_SERUM',
      suggestedPrice: 0,
      displayOrder: 0,
      active: true,
      parameters: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'parameters' });

  useEffect(() => {
    if (!open) return;
    if (test) {
      reset({
        code: test.code,
        name: test.name,
        departmentName: test.departmentName,
        category: test.category ?? '',
        specimenType: test.specimenType,
        suggestedPrice: test.suggestedPrice,
        turnaroundHours: test.turnaroundHours ?? null,
        displayOrder: test.displayOrder,
        active: test.active,
        parameters: test.parameters.map((p) => ({
          code: p.code ?? '',
          name: p.name,
          unit: p.unit ?? '',
          dataType: p.dataType,
          decimalPlaces: p.decimalPlaces,
          groupHeading: p.groupHeading ?? '',
          low: p.referenceRanges[0]?.lowValue ?? null,
          high: p.referenceRanges[0]?.highValue ?? null,
          criticalLow: p.referenceRanges[0]?.criticalLow ?? null,
          criticalHigh: p.referenceRanges[0]?.criticalHigh ?? null,
        })),
      });
    } else {
      reset({
        code: '',
        name: '',
        departmentName: '',
        category: '',
        specimenType: 'BLOOD_SERUM',
        suggestedPrice: 0,
        turnaroundHours: null,
        displayOrder: 0,
        active: true,
        parameters: [],
      });
    }
  }, [open, test, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      departmentName: values.departmentName.trim(),
      category: values.category || undefined,
      specimenType: values.specimenType as MasterTestDetail['specimenType'],
      suggestedPrice: values.suggestedPrice,
      turnaroundHours: values.turnaroundHours ?? undefined,
      displayOrder: values.displayOrder,
      active: values.active,
      parameters: values.parameters.map((p, i) => ({
        code: p.code || null,
        name: p.name.trim(),
        unit: p.unit || null,
        dataType: p.dataType,
        displayOrder: i + 1,
        decimalPlaces: p.decimalPlaces,
        groupHeading: p.groupHeading || null,
        referenceRanges:
          p.low != null || p.high != null || p.criticalLow != null || p.criticalHigh != null
            ? [
                {
                  appliesToGender: 'ALL' as const,
                  lowValue: p.low,
                  highValue: p.high,
                  criticalLow: p.criticalLow,
                  criticalHigh: p.criticalHigh,
                  normalText: null,
                },
              ]
            : [],
      })),
    };

    try {
      if (isEdit) {
        await masterCatalogAdminApi.update(test!.id, payload);
        toast.success('Master test updated');
      } else {
        await masterCatalogAdminApi.create(payload);
        toast.success('Master test created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save');
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${test?.code}` : 'New master test'}
      description="Curated for every clinic to import — not tied to any one clinic's own catalog."
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input label="Code" error={errors.code?.message} {...register('code')} />
          <Input label="Name" className="col-span-2" error={errors.name?.message} {...register('name')} />
          <Input label="Department" hint="Auto-created per clinic if missing" error={errors.departmentName?.message} {...register('departmentName')} />
          <Input label="Category" {...register('category')} />
          <Select label="Specimen type" options={SPECIMEN_OPTIONS} {...register('specimenType')} />
          <Input label="Suggested price" type="number" step="0.01" {...register('suggestedPrice')} />
          <Input label="Turnaround (hrs)" type="number" {...register('turnaroundHours')} />
          <Input label="Display order" type="number" {...register('displayOrder')} />
        </div>
        <Checkbox label="Active (visible to clinics for import)" {...register('active')} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Parameters</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  code: '',
                  name: '',
                  unit: '',
                  dataType: 'NUMERIC',
                  decimalPlaces: null,
                  groupHeading: '',
                  low: null,
                  high: null,
                  criticalLow: null,
                  criticalHigh: null,
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add parameter
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
              No parameters yet.
            </p>
          ) : (
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="rounded-md border border-border p-2.5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                    <Input placeholder="Code" {...register(`parameters.${i}.code`)} />
                    <Input
                      placeholder="Name"
                      className="col-span-2"
                      error={errors.parameters?.[i]?.name?.message}
                      {...register(`parameters.${i}.name`)}
                    />
                    <Input placeholder="Unit" {...register(`parameters.${i}.unit`)} />
                    <Select options={DATA_TYPE_OPTIONS} {...register(`parameters.${i}.dataType`)} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(i)}
                      aria-label="Remove parameter"
                    >
                      <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Input placeholder="Decimal places" type="number" {...register(`parameters.${i}.decimalPlaces`)} />
                    <Input placeholder="Low" type="number" step="any" {...register(`parameters.${i}.low`)} />
                    <Input placeholder="High" type="number" step="any" {...register(`parameters.${i}.high`)} />
                    <Input placeholder="Critical low" type="number" step="any" {...register(`parameters.${i}.criticalLow`)} />
                    <Input placeholder="Critical high" type="number" step="any" {...register(`parameters.${i}.criticalHigh`)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.parameters && !Array.isArray(errors.parameters) && (
            <div className="mt-2">
              <Alert tone="danger">{errors.parameters.message}</Alert>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
