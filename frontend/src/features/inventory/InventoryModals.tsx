import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { departmentsApi } from '@/features/departments/api';
import { inventoryApi, suppliersApi } from './api';
import { CATEGORY_LABEL, type InventoryItemDetail } from './types';

function useSubmit(onDone: () => void, onClose: () => void) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      toast.success(msg);
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export function ItemFormModal({
  open,
  onClose,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: InventoryItemDetail | null;
  onSaved: () => void;
}) {
  const { busy, error, run } = useSubmit(onSaved, onClose);
  const departments = useQuery(() => departmentsApi.list(true), [open]);
  const [f, setF] = useState({ code: '', name: '', category: 'REAGENT', unit: '', minimumStock: '0', departmentId: '', notes: '' });

  useEffect(() => {
    if (!open) return;
    setF(
      item
        ? {
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            minimumStock: String(item.minimumStock),
            departmentId: item.departmentId ? String(item.departmentId) : '',
            notes: item.notes ?? '',
          }
        : { code: '', name: '', category: 'REAGENT', unit: '', minimumStock: '0', departmentId: '', notes: '' },
    );
  }, [open, item]);

  const submit = () => {
    const payload = {
      code: f.code.trim().toUpperCase(),
      name: f.name.trim(),
      category: f.category,
      unit: f.unit.trim(),
      minimumStock: Number(f.minimumStock) || 0,
      departmentId: f.departmentId ? Number(f.departmentId) : null,
      notes: f.notes || undefined,
    };
    run(
      () => (item ? inventoryApi.update(item.id, payload) : inventoryApi.create(payload)),
      item ? 'Item updated' : 'Item created',
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Edit ${item.code}` : 'New inventory item'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            {item ? 'Save' : 'Create item'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Code" disabled={!!item} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Select
            label="Category"
            options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
          />
          <Input label="Unit" placeholder="mL, tests, pcs, box" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
          <Input
            label="Minimum stock"
            type="number"
            step="any"
            min={0}
            value={f.minimumStock}
            onChange={(e) => setF({ ...f, minimumStock: e.target.value })}
          />
          <Select
            label="Department"
            options={[
              { value: '', label: 'None' },
              ...(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
            ]}
            value={f.departmentId}
            onChange={(e) => setF({ ...f, departmentId: e.target.value })}
          />
        </div>
        <Textarea label="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
    </Modal>
  );
}

export function ReceiveStockModal({
  open,
  onClose,
  item,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  item: InventoryItemDetail;
  onDone: () => void;
}) {
  const { busy, error, run } = useSubmit(onDone, onClose);
  const suppliers = useQuery(() => suppliersApi.active(), [open]);
  const [f, setF] = useState({ batchNumber: '', supplierId: '', receivedDate: '', expiryDate: '', quantity: '', unitCost: '', reference: '' });

  useEffect(() => {
    if (open) setF({ batchNumber: '', supplierId: '', receivedDate: '', expiryDate: '', quantity: '', unitCost: '', reference: '' });
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Receive stock · ${item.code}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={() =>
              run(
                () =>
                  inventoryApi.receive(item.id, {
                    batchNumber: f.batchNumber.trim(),
                    supplierId: f.supplierId ? Number(f.supplierId) : null,
                    receivedDate: f.receivedDate || null,
                    expiryDate: f.expiryDate || null,
                    quantity: Number(f.quantity),
                    unitCost: f.unitCost ? Number(f.unitCost) : null,
                    reference: f.reference || undefined,
                  }),
                'Stock received',
              )
            }
          >
            Receive
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Batch / lot number" value={f.batchNumber} onChange={(e) => setF({ ...f, batchNumber: e.target.value })} />
          <Select
            label="Supplier"
            options={[{ value: '', label: 'Not specified' }, ...(suppliers.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))]}
            value={f.supplierId}
            onChange={(e) => setF({ ...f, supplierId: e.target.value })}
          />
          <Input label="Received date" type="date" value={f.receivedDate} onChange={(e) => setF({ ...f, receivedDate: e.target.value })} />
          <Input label="Expiry date" type="date" value={f.expiryDate} onChange={(e) => setF({ ...f, expiryDate: e.target.value })} />
          <Input label={`Quantity (${item.unit})`} type="number" step="any" min={0} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
          <Input label="Unit cost (NPR)" type="number" step="any" min={0} value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} />
        </div>
        <Input label="Reference (invoice / GRN no.)" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
      </div>
    </Modal>
  );
}

export function IssueStockModal({
  open,
  onClose,
  item,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  item: InventoryItemDetail;
  onDone: () => void;
}) {
  const { busy, error, run } = useSubmit(onDone, onClose);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setQuantity('');
      setReason('');
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Issue stock · ${item.code}`}
      description={`${item.quantityOnHand} ${item.unit} on hand · consumed first-expiry-first-out`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={() =>
              run(() => inventoryApi.issue(item.id, { quantity: Number(quantity), reason: reason.trim() }), 'Stock issued')
            }
          >
            Issue
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label={`Quantity (${item.unit})`} type="number" step="any" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Textarea label="Reason / purpose" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}
