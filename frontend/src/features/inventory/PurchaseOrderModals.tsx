import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { inventoryApi, purchaseOrdersApi, suppliersApi } from './api';
import type { PurchaseOrderDetail } from './types';

interface DraftLine {
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: string;
  estimatedUnitCost: string;
}

export function PurchaseOrderBuilderModal({
  open,
  onClose,
  po,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrderDetail | null;
  onSaved: (id: number) => void;
}) {
  const toast = useToast();
  const suppliers = useQuery(() => suppliersApi.active(), [open]);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 300);
  const [results, setResults] = useState<{ id: number; code: string; name: string; unit: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    if (po) {
      setSupplierId(String(po.supplierId));
      setExpectedDate(po.expectedDate ?? '');
      setNotes(po.notes ?? '');
      setLines(
        po.lines.map((l) => ({
          itemId: l.itemId,
          itemCode: l.itemCode,
          itemName: l.itemName,
          unit: l.unit,
          quantity: String(l.quantityOrdered),
          estimatedUnitCost: l.estimatedUnitCost != null ? String(l.estimatedUnitCost) : '',
        })),
      );
    } else {
      setSupplierId('');
      setExpectedDate('');
      setNotes('');
      setLines([]);
    }
    setTerm('');
    setErr(null);
  }, [open, po]);

  useEffect(() => {
    if (debounced.trim().length < 1) {
      setResults([]);
      return;
    }
    inventoryApi.list({ query: debounced, activeOnly: true, size: 8 }).then((r) =>
      setResults(r.content.map((i) => ({ id: i.id, code: i.code, name: i.name, unit: i.unit }))),
    );
  }, [debounced]);

  const submit = async () => {
    setErr(null);
    if (!supplierId) return setErr('Select a supplier.');
    if (lines.length === 0) return setErr('Add at least one line.');
    setBusy(true);
    try {
      const payload = {
        supplierId: Number(supplierId),
        expectedDate: expectedDate || null,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          quantity: Number(l.quantity),
          estimatedUnitCost: l.estimatedUnitCost ? Number(l.estimatedUnitCost) : null,
        })),
      };
      const saved = po ? await purchaseOrdersApi.update(po.id, payload) : await purchaseOrdersApi.create(payload);
      toast.success(po ? 'Purchase order updated' : `Draft ${saved.poNumber} created`);
      onSaved(saved.id);
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={po ? `Edit ${po.poNumber}` : 'New purchase order'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            {po ? 'Save' : 'Create draft'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <Alert tone="danger">{err}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Supplier"
            placeholder="Select…"
            options={(suppliers.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />
          <Input label="Expected date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Items</p>
          <Input
            leadingIcon={<Search className="h-4 w-4" aria-hidden />}
            placeholder="Search inventory items to add"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="mt-2 divide-y divide-border rounded-md border border-border">
              {results.map((r) => {
                const added = lines.some((l) => l.itemId === r.id);
                return (
                  <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium text-foreground">{r.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted">{r.code}</span>
                    </span>
                    <Button
                      size="sm"
                      variant={added ? 'ghost' : 'secondary'}
                      disabled={added}
                      onClick={() => {
                        setLines((prev) => [
                          ...prev,
                          { itemId: r.id, itemCode: r.code, itemName: r.name, unit: r.unit, quantity: '1', estimatedUnitCost: '' },
                        ]);
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

          {lines.length > 0 && (
            <ul className="mt-3 space-y-2">
              {lines.map((l, index) => (
                <li key={l.itemId} className="grid grid-cols-[1fr,80px,90px,auto] items-end gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.itemName}</p>
                    <p className="font-mono text-xs text-muted">{l.itemCode}</p>
                  </div>
                  <Input
                    label={`Qty (${l.unit})`}
                    type="number"
                    step="any"
                    min={0}
                    value={l.quantity}
                    onChange={(e) => setLines((p) => p.map((x, i) => (i === index ? { ...x, quantity: e.target.value } : x)))}
                  />
                  <Input
                    label="Est. cost"
                    type="number"
                    step="any"
                    min={0}
                    value={l.estimatedUnitCost}
                    onChange={(e) => setLines((p) => p.map((x, i) => (i === index ? { ...x, estimatedUnitCost: e.target.value } : x)))}
                  />
                  <button
                    type="button"
                    onClick={() => setLines((p) => p.filter((_, i) => i !== index))}
                    className="mb-2 text-muted hover:text-danger"
                    aria-label={`Remove ${l.itemName}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

export function ReceivePurchaseOrderModal({
  open,
  onClose,
  po,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  po: PurchaseOrderDetail;
  onDone: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Record<number, { batchNumber: string; expiryDate: string; quantity: string; unitCost: string }>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(
      Object.fromEntries(
        po.lines
          .filter((l) => l.quantityReceived < l.quantityOrdered)
          .map((l) => [l.id, { batchNumber: '', expiryDate: '', quantity: String(l.quantityOrdered - l.quantityReceived), unitCost: l.estimatedUnitCost != null ? String(l.estimatedUnitCost) : '' }]),
      ),
    );
    setErr(null);
  }, [open, po]);

  const submit = async () => {
    const lines = Object.entries(rows)
      .filter(([, r]) => Number(r.quantity) > 0 && r.batchNumber.trim())
      .map(([poItemId, r]) => ({
        poItemId: Number(poItemId),
        batchNumber: r.batchNumber.trim(),
        expiryDate: r.expiryDate || null,
        quantity: Number(r.quantity),
        unitCost: r.unitCost ? Number(r.unitCost) : null,
      }));
    if (lines.length === 0) {
      setErr('Enter a batch number and quantity for at least one line.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await purchaseOrdersApi.receive(po.id, { lines });
      toast.success('Stock received');
      onDone();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Unable to receive');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Receive against ${po.poNumber}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Receive stock
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <Alert tone="danger">{err}</Alert>}
        {po.lines
          .filter((l) => l.quantityReceived < l.quantityOrdered)
          .map((l) => {
            const r = rows[l.id] ?? { batchNumber: '', expiryDate: '', quantity: '', unitCost: '' };
            const set = (patch: Partial<typeof r>) => setRows((prev) => ({ ...prev, [l.id]: { ...r, ...patch } }));
            return (
              <div key={l.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium text-foreground">
                  {l.itemName} <span className="font-mono text-xs text-muted">{l.itemCode}</span>
                </p>
                <p className="mb-2 text-xs text-muted">
                  Ordered {l.quantityOrdered} {l.unit} · received {l.quantityReceived}
                </p>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Input label="Batch no." value={r.batchNumber} onChange={(e) => set({ batchNumber: e.target.value })} />
                  <Input label="Expiry" type="date" value={r.expiryDate} onChange={(e) => set({ expiryDate: e.target.value })} />
                  <Input label={`Qty (${l.unit})`} type="number" step="any" min={0} value={r.quantity} onChange={(e) => set({ quantity: e.target.value })} />
                  <Input label="Unit cost" type="number" step="any" min={0} value={r.unitCost} onChange={(e) => set({ unitCost: e.target.value })} />
                </div>
              </div>
            );
          })}
      </div>
    </Modal>
  );
}
