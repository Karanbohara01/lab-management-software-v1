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
import { useT, tOpts } from '@/i18n';
import { inventoryApi, suppliersApi } from './api';
import { CATEGORY_LABEL, type InventoryItemDetail } from './types';

function useSubmit(onDone: () => void, onClose: () => void) {
  const toast = useToast();
  const t = useT();
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
      setError(err instanceof ApiError ? err.message : t('Action failed'));
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
  const t = useT();
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
      item ? t('Item updated') : t('Item created'),
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? t('Edit {code}', { code: item.code }) : t('New inventory item')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button onClick={submit} loading={busy}>
            {item ? t('Save') : t('Create item')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('Code')} disabled={!!item} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          <Input label={t('Name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Select
            label={t('Category')}
            options={tOpts(Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })))}
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
          />
          <Input label={t('Unit')} placeholder={t('mL, tests, pcs, box')} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
          <Input
            label={t('Minimum stock')}
            type="number"
            step="any"
            min={0}
            value={f.minimumStock}
            onChange={(e) => setF({ ...f, minimumStock: e.target.value })}
          />
          <Select
            label={t('Department')}
            options={[
              { value: '', label: t('None') },
              ...(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
            ]}
            value={f.departmentId}
            onChange={(e) => setF({ ...f, departmentId: e.target.value })}
          />
        </div>
        <Textarea label={t('Notes')} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
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
  const t = useT();
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
      title={t('Receive stock · {code}', { code: item.code })}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
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
                t('Stock received'),
              )
            }
          >
            {t('Receive')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('Batch / lot number')} value={f.batchNumber} onChange={(e) => setF({ ...f, batchNumber: e.target.value })} />
          <Select
            label={t('Supplier')}
            options={[{ value: '', label: t('Not specified') }, ...(suppliers.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))]}
            value={f.supplierId}
            onChange={(e) => setF({ ...f, supplierId: e.target.value })}
          />
          <Input label={t('Received date')} type="date" value={f.receivedDate} onChange={(e) => setF({ ...f, receivedDate: e.target.value })} />
          <Input label={t('Expiry date')} type="date" value={f.expiryDate} onChange={(e) => setF({ ...f, expiryDate: e.target.value })} />
          <Input label={t('Quantity ({unit})', { unit: item.unit })} type="number" step="any" min={0} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
          <Input label={t('Unit cost (NPR)')} type="number" step="any" min={0} value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: e.target.value })} />
        </div>
        <Input label={t('Reference (invoice / GRN no.)')} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
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
  const t = useT();
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
      title={t('Issue stock · {code}', { code: item.code })}
      description={t('{qty} {unit} on hand · consumed first-expiry-first-out', { qty: item.quantityOnHand, unit: item.unit })}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button
            loading={busy}
            onClick={() =>
              run(() => inventoryApi.issue(item.id, { quantity: Number(quantity), reason: reason.trim() }), t('Stock issued'))
            }
          >
            {t('Issue')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label={t('Quantity ({unit})', { unit: item.unit })} type="number" step="any" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Textarea label={t('Reason / purpose')} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}
