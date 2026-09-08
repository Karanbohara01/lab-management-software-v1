import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/PageState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { formatMoney } from '@/lib/money';
import { patientsApi } from '@/features/patients/api';
import type { PatientListItem } from '@/features/patients/types';
import { doctorsApi } from '@/features/doctors/api';
import { testCatalogApi } from '@/features/catalog/api';
import type { TestListItem } from '@/features/catalog/types';
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
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit || !!searchParams.get('patientId'));
  const [patient, setPatient] = useState<PickedPatient | null>(null);
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

  const [doctors, setDoctors] = useState<{ id: number; fullName: string }[]>([]);

  // ---- initial load -------------------------------------------------
  useEffect(() => {
    doctorsApi.list({ activeOnly: true, size: 200 }).then((res) => setDoctors(res.content));
  }, []);

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
      }
      setLoading(false);
    }
    bootstrap().catch(() => {
      toast.error('Unable to load the order builder');
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    if (!patient) return setFormError('Select a patient.');
    if (rows.length === 0) return setFormError('Add at least one test.');
    setSaving(true);
    try {
      const payload = {
        patientId: patient.id,
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
      toast.success(confirm ? `Order ${saved.orderNumber} confirmed` : `Draft ${saved.orderNumber} saved`);
      navigate(`/app/orders/${saved.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to save the order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading…" />;

  return (
    <>
      <Link to="/app/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Lab orders
      </Link>
      <PageHeader title={isEdit ? 'Edit draft order' : 'New lab order'} />

      {formError && (
        <div className="mb-4">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Patient" />
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
                      Change
                    </Button>
                  )}
                </div>
              ) : (
                <PatientPicker onSelect={setPatient} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tests" description="Search the catalog and add the tests to order." />
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
                  No tests added yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                        <th className="py-2 pr-3">Test</th>
                        <th className="px-2 py-2 text-right">Rate</th>
                        <th className="px-2 py-2 text-center">Qty</th>
                        <th className="px-2 py-2 text-right">Line disc.</th>
                        <th className="px-2 py-2 text-right">Total</th>
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
                              aria-label={`Quantity for ${row.testName}`}
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
                              aria-label={`Line discount for ${row.testName}`}
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
                              aria-label={`Remove ${row.testName}`}
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
            <CardHeader title="Referral & notes" />
            <CardBody className="space-y-4">
              <Select
                label="Referring doctor"
                options={[
                  { value: '', label: 'No referring doctor' },
                  ...doctors.map((d) => ({ value: String(d.id), label: d.fullName })),
                ]}
                value={referringDoctorId}
                onChange={(e) => setReferringDoctorId(e.target.value)}
              />
              <Select
                label="Priority"
                options={[
                  { value: 'ROUTINE', label: 'Routine' },
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'STAT', label: 'STAT � jumps the queue, tighter turnaround' },
                ]}
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
              />
              <Textarea
                label="Clinical notes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Discount & tax" />
            <CardBody className="space-y-3">
              <Select
                label="Discount type"
                options={[
                  { value: 'NONE', label: 'No discount' },
                  { value: 'PERCENT', label: 'Percentage (%)' },
                  { value: 'AMOUNT', label: 'Flat amount (NPR)' },
                ]}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              />
              {discountType !== 'NONE' && (
                <Input
                  label={discountType === 'PERCENT' ? 'Discount %' : 'Discount amount'}
                  type="number"
                  min={0}
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              )}
              <Input
                label="Tax rate %"
                type="number"
                min={0}
                step="any"
                hint="Most diagnostic services in Nepal are VAT-exempt — leave at 0 unless advised."
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order summary" />
            <CardBody className="space-y-4">
              <PricingSummary pricing={pricing} />
              <div className="flex flex-col gap-2">
                <Button onClick={() => save(true)} loading={saving} disabled={rows.length === 0 || !patient}>
                  Save &amp; confirm
                </Button>
                <Button variant="secondary" onClick={() => save(false)} loading={saving}>
                  Save as draft
                </Button>
              </div>
              <p className="text-xs text-muted">
                Totals are recalculated and finalised by the server on save.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function PatientPicker({ onSelect }: { onSelect: (p: PickedPatient) => void }) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 300);
  const [results, setResults] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    patientsApi
      .list({ query: debounced, activeOnly: true, size: 8 })
      .then((r) => setResults(r.content))
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div>
      <Input
        leadingIcon={<Search className="h-4 w-4" aria-hidden />}
        placeholder="Search patient by name, MRN or phone"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {loading && <p className="mt-2 text-sm text-muted">Searching…</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span>
                  <span className="font-medium text-foreground">{p.fullName}</span>
                  <span className="ml-2 text-muted">{p.gender[0]}{p.ageYears != null ? ` · ${p.ageYears}y` : ''}</span>
                </span>
                <span className="font-mono text-xs text-muted">{p.mrn}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {debounced.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="mt-2 text-sm text-muted">
          No patients found. <Link to="/app/patients" className="text-primary">Register one first.</Link>
        </p>
      )}
    </div>
  );
}

function TestPicker({
  existingIds,
  onAdd,
}: {
  existingIds: number[];
  onAdd: (t: TestListItem) => void;
}) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 300);
  const [results, setResults] = useState<TestListItem[]>([]);

  useEffect(() => {
    if (debounced.trim().length < 1) {
      setResults([]);
      return;
    }
    testCatalogApi.list({ query: debounced, activeOnly: true, size: 8 }).then((r) => setResults(r.content));
  }, [debounced]);

  return (
    <div>
      <Input
        leadingIcon={<Search className="h-4 w-4" aria-hidden />}
        placeholder="Search tests by name or code"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border">
          {results.map((t) => {
            const added = existingIds.includes(t.id);
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-foreground">{t.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted">{t.code}</span>
                  <span className="ml-2 text-muted">{formatMoney(t.price)}</span>
                </span>
                <Button
                  size="sm"
                  variant={added ? 'ghost' : 'secondary'}
                  disabled={added}
                  onClick={() => {
                    onAdd(t);
                    setTerm('');
                  }}
                >
                  {added ? 'Added' : <><Plus className="h-4 w-4" aria-hidden /> Add</>}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
