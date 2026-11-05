import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/PageState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useScrollToTopOnError } from '@/hooks/useScrollToTopOnError';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useBackTarget, useNavigateFrom } from '@/lib/navigation';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { formatMoney } from '@/lib/money';
import { patientsApi } from '@/features/patients/api';
import { PatientPicker } from '@/features/patients/PatientPicker';
import { doctorsApi } from '@/features/doctors/api';
import { testCatalogApi } from '@/features/catalog/api';
import { TestPicker } from '@/features/catalog/TestPicker';
import { branchesApi, type Branch } from '@/features/branches/api';
import { useAuth } from '@/features/auth/useAuth';
import { appointmentsApi } from '@/features/appointments/api';
import { useT } from '@/i18n';
import { ordersApi } from './api';
import type { DiscountType, OrderPricing, OrderPriority } from './types';
import { PricingSummary } from './PricingSummary';

/** Just the fields the order builder shows for the selected patient. */
interface PickedPatient {
  id: number;
  mrn: string;
  fullName: string;
  phone: string | null;
}

interface Row {
  testId: number;
  testCode: string;
  testName: string;
  departmentName: string;
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
}

const ZERO_PRICING: OrderPricing = {
  subtotal: 0,
  discountType: 'NONE',
  discountValue: 0,
  discountAmount: 0,
  taxableAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 0,
};

export function OrderBuilderPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigateFrom();
  const location = useLocation();
  const { back } = useBackTarget();
  const toast = useToast();
  const { user } = useAuth();
  const isBranchScoped = !!user?.homeBranchId;

  const [loading, setLoading] = useState(
    isEdit || !!searchParams.get('patientId') || !!searchParams.get('appointmentId'),
  );
  const [patient, setPatient] = useState<PickedPatient | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [referringDoctorId, setReferringDoctorId] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [priority, setPriority] = useState<OrderPriority>('ROUTINE');
  const [rows, setRows] = useState<Row[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [pricing, setPricing] = useState<OrderPricing>(ZERO_PRICING);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  useScrollToTopOnError(formError);

  const [doctors, setDoctors] = useState<{ id: number; fullName: string }[]>([]);

  // ---- initial load -------------------------------------------------
  useEffect(() => {
    doctorsApi.list({ activeOnly: true, size: 200 }).then((res) => setDoctors(res.content));
  }, []);

  useEffect(() => {
    if (isBranchScoped) return;
    branchesApi.list(true).then(setBranches);
  }, [isBranchScoped]);

  useEffect(() => {
    async function bootstrap() {
      if (isEdit) {
        const order = await ordersApi.get(Number(id));
        if (order.status !== 'DRAFT') {
          navigate(`/app/orders/${order.id}`, { replace: true });
          return;
        }
        setPatient({
          id: order.patientId,
          mrn: order.patientMrn,
          fullName: order.patientName,
          phone: null,
        });
        setBranchId(String(order.branchId));
        setReferringDoctorId(order.referringDoctorId ? String(order.referringDoctorId) : '');
        setClinicalNotes(order.clinicalNotes ?? '');
        setPriority(order.priority ?? 'ROUTINE');
        setRows(
          order.items.map((it) => ({
            testId: it.testId,
            testCode: it.testCode,
            testName: it.testName,
            departmentName: it.departmentName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            lineDiscount: it.lineDiscount,
          })),
        );
        setDiscountType(order.pricing.discountType);
        setDiscountValue(String(order.pricing.discountValue));
        setTaxRate(String(order.pricing.taxRate));
      } else {
        const preset = searchParams.get('patientId');
        if (preset) {
          const p = await patientsApi.get(Number(preset));
          setPatient({
            id: p.id,
            mrn: p.mrn,
            fullName: p.fullName,
            phone: p.phone,
          });
          if (p.referringDoctorId) setReferringDoctorId(String(p.referringDoctorId));
        }

        // Converting a booked appointment: carry its expected tests across. The appointment
        // stores catalog references only (never a price), so current rates are read from the
        // catalog here — and the server re-prices authoritatively on save regardless.
        const appointmentId = searchParams.get('appointmentId');
        if (appointmentId) {
          const appt = await appointmentsApi.get(Number(appointmentId));
          if (appt.referringDoctorId) setReferringDoctorId(String(appt.referringDoctorId));
          if (appt.branchId) setBranchId(String(appt.branchId));
          if (appt.items.length > 0) {
            const tests = await Promise.all(appt.items.map((it) => testCatalogApi.get(it.testId)));
            setRows(
              appt.items.map((it, i) => ({
                testId: it.testId,
                testCode: it.testCode,
                testName: it.testName,
                departmentName: it.departmentName,
                unitPrice: tests[i]?.price ?? 0,
                quantity: it.quantity,
                lineDiscount: 0,
              })),
            );
          }
        }
      }
      setLoading(false);
    }
    bootstrap().catch(() => {
      toast.error(t('Unable to load the order builder'));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * This form is plain state, so there's no `isDirty` to read: compare what's on screen against
   * the snapshot taken once loading finished (an empty form, the order being edited, or whatever
   * a patient/appointment preset filled in). Anything the user changed after that is unsaved work.
   */
  const snapshot = JSON.stringify({ patient: patient?.id ?? null, branchId, referringDoctorId, clinicalNotes, priority, rows, discountType, discountValue, taxRate });
  const baseline = useRef<string | null>(null);
  useEffect(() => {
    if (!loading && baseline.current === null) baseline.current = snapshot;
  }, [loading, snapshot]);
  const isDirty = baseline.current !== null && snapshot !== baseline.current;
  const { allowNextNavigation, dialog: unsavedDialog } = useUnsavedChanges(isDirty);

  // ---- pricing preview (debounced) --------------------------------
  const priceInputs = useMemo(
    () => ({
      items: rows.map((r) => ({ testId: r.testId, quantity: r.quantity, lineDiscount: r.lineDiscount })),
      discountType,
      discountValue: Number(discountValue) || 0,
      taxRate: Number(taxRate) || 0,
    }),
    [rows, discountType, discountValue, taxRate],
  );
  const debouncedInputs = useDebouncedValue(priceInputs, 350);

  useEffect(() => {
    if (debouncedInputs.items.length === 0) {
      setPricing({ ...ZERO_PRICING, discountType, taxRate: Number(taxRate) || 0 });
      return;
    }
    let cancelled = false;
    ordersApi
      .preview(debouncedInputs)
      .then((p) => {
        if (!cancelled) setPricing(p);
      })
      .catch(() => {
        /* preview failures are non-fatal; the server recomputes on save */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputs]);

  // ---- save -------------------------------------------------------
  const save = async (confirm: boolean) => {
    setFormError(null);
    if (!patient) return setFormError(t('Select a patient.'));
    if (rows.length === 0) return setFormError(t('Add at least one test.'));
    setSaving(true);
    try {
      const payload = {
        patientId: patient.id,
        branchId: !isBranchScoped && branchId ? Number(branchId) : undefined,
        referringDoctorId: referringDoctorId ? Number(referringDoctorId) : null,
        clinicalNotes: clinicalNotes || undefined,
        priority,
        items: rows.map((r) => ({ testId: r.testId, quantity: r.quantity, lineDiscount: r.lineDiscount })),
        discountType,
        discountValue: Number(discountValue) || 0,
        taxRate: Number(taxRate) || 0,
        confirm,
      };
      const saved = isEdit
        ? await ordersApi.update(Number(id), payload)
        : await ordersApi.create(payload);
      toast.success(
        confirm
          ? t('Order {number} confirmed', { number: saved.orderNumber })
          : t('Draft {number} saved', { number: saved.orderNumber }),
      );

      // Booked from an appointment ("Convert to order")? Link the appointment to this order so
      // it moves to CONVERTED — best-effort: the order itself is already safely created either way.
      const appointmentId = searchParams.get('appointmentId');
      if (!isEdit && appointmentId) {
        try {
          await appointmentsApi.convert(Number(appointmentId), saved.id);
        } catch {
          toast.error(t('Order created, but the appointment could not be marked as converted'));
        }
      }

      // The order is saved, so the unsaved-changes guard mustn't challenge this. Replace, so Back
      // from the order skips this builder and returns to wherever the user started.
      allowNextNavigation();
      navigate(`/app/orders/${saved.id}`, { replace: true, state: location.state });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('Unable to save the order'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label={t('Loading…')} />;

  return (
    <>
      {unsavedDialog}
      <PageHeader
        back={back}
        title={isEdit ? t('Edit draft order') : t('New lab order')}
        actions={
          // This form had no way out but the back link, which always went to the orders list even
          // when the user arrived from a patient or an appointment.
          <Button variant="secondary" type="button" onClick={() => navigate(back.href)}>
            {t('Cancel')}
          </Button>
        }
      />

      {formError && (
        <div className="mb-4">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title={t('Patient')} />
            <CardBody>
              {patient ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {patient.fullName}{' '}
                      <span className="font-mono text-xs text-muted">{patient.mrn}</span>
                    </p>
                    {patient.phone && <p className="text-sm text-muted">{patient.phone}</p>}
                  </div>
                  {!isEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setPatient(null)}>
                      <X className="h-4 w-4" aria-hidden />
                      {t('Change')}
                    </Button>
                  )}
                </div>
              ) : (
                <PatientPicker onSelect={setPatient} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Tests')} description={t('Search the catalog and add the tests to order.')} />
            <CardBody className="space-y-4">
              <TestPicker
                existingIds={rows.map((r) => r.testId)}
                onAdd={(t) =>
                  setRows((prev) => [
                    ...prev,
                    {
                      testId: t.id,
                      testCode: t.code,
                      testName: t.name,
                      departmentName: t.departmentName,
                      unitPrice: t.price,
                      quantity: 1,
                      lineDiscount: 0,
                    },
                  ])
                }
              />

              {rows.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
                  {t('No tests added yet.')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                        <th className="py-2 pr-3">{t('Test')}</th>
                        <th className="px-2 py-2 text-right">{t('Rate')}</th>
                        <th className="px-2 py-2 text-center">{t('Qty')}</th>
                        <th className="px-2 py-2 text-right">{t('Line disc.')}</th>
                        <th className="px-2 py-2 text-right">{t('Total')}</th>
                        <th className="py-2 pl-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.testId} className="border-b border-border last:border-0">
                          <td className="py-2 pr-3">
                            <span className="font-medium text-foreground">{row.testName}</span>
                            <span className="ml-1.5 font-mono text-xs text-muted">{row.testCode}</span>
                          </td>
                          <td className="px-2 py-2 text-right">{formatMoney(row.unitPrice)}</td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={row.quantity}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, quantity: Math.max(1, Number(e.target.value) || 1) } : r,
                                  ),
                                )
                              }
                              className="h-8 w-16 rounded-md border border-input bg-surface px-2 text-center"
                              aria-label={t('Quantity for {test}', { test: row.testName })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={row.lineDiscount}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, lineDiscount: Math.max(0, Number(e.target.value) || 0) } : r,
                                  ),
                                )
                              }
                              className="h-8 w-20 rounded-md border border-input bg-surface px-2 text-right"
                              aria-label={t('Line discount for {test}', { test: row.testName })}
                            />
                          </td>
                          <td className="px-2 py-2 text-right font-medium">
                            {formatMoney(Math.max(0, row.unitPrice * row.quantity - row.lineDiscount))}
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                              className="text-muted hover:text-danger"
                              aria-label={t('Remove {test}', { test: row.testName })}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Referral & notes')} />
            <CardBody className="space-y-4">
              {!isBranchScoped && (
                <Select
                  label={t('Branch')}
                  placeholder={t('Default branch')}
                  options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                />
              )}
              <Combobox
                label={t('Referring doctor')}
                placeholder={t('No referring doctor')}
                options={doctors.map((d) => ({ value: String(d.id), label: d.fullName }))}
                value={referringDoctorId}
                onChange={setReferringDoctorId}
              />
              <Select
                label={t('Priority')}
                options={[
                  { value: 'ROUTINE', label: t('Routine') },
                  { value: 'URGENT', label: t('Urgent') },
                  { value: 'STAT', label: t('STAT — jumps the queue, tighter turnaround') },
                ]}
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
              />
              <Textarea
                label={t('Clinical notes')}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t('Discount & tax')} />
            <CardBody className="space-y-3">
              <Select
                label={t('Discount type')}
                options={[
                  { value: 'NONE', label: t('No discount') },
                  { value: 'PERCENT', label: t('Percentage (%)') },
                  { value: 'AMOUNT', label: t('Flat amount (NPR)') },
                ]}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              />
              {discountType !== 'NONE' && (
                <Input
                  label={discountType === 'PERCENT' ? t('Discount %') : t('Discount amount')}
                  type="number"
                  min={0}
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              )}
              <Input
                label={t('Tax rate %')}
                type="number"
                min={0}
                step="any"
                hint={t('Most diagnostic services in Nepal are VAT-exempt — leave at 0 unless advised.')}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Order summary')} />
            <CardBody className="space-y-4">
              <PricingSummary pricing={pricing} />
              <div className="flex flex-col gap-2">
                <Button onClick={() => save(true)} loading={saving} disabled={rows.length === 0 || !patient}>
                  {t('Save & confirm')}
                </Button>
                <Button variant="secondary" onClick={() => save(false)} loading={saving}>
                  {t('Save as draft')}
                </Button>
              </div>
              <p className="text-xs text-muted">
                {t('Totals are recalculated and finalised by the server on save.')}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

