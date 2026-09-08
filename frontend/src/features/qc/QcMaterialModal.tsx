import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { ApiError } from '@/types/api';
import { testCatalogApi } from '@/features/catalog/api';
import { qcApi } from './api';
import type { QcMaterial } from './types';

const LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LOW', 'NORMAL', 'HIGH'];

interface TargetRow {
  parameterId: number;
  parameterName: string;
  targetMean: string;
  targetSd: string;
}

export function QcMaterialModal({
  open,
  onClose,
  material,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  material: QcMaterial | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const tests = useQuery(() => testCatalogApi.list({ activeOnly: true, size: 500 }), [open]);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [lot, setLot] = useState('');
  const [level, setLevel] = useState('LEVEL_1');
  const [testId, setTestId] = useState('');
  const [expiry, setExpiry] = useState('');
  const [active, setActive] = useState(true);
  const [rows, setRows] = useState<TargetRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTest = useQuery(
    () => (testId ? testCatalogApi.get(Number(testId)) : Promise.resolve(null)),
    [testId],
  );

  useEffect(() => {
    if (!open) return;
    if (material) {
      setName(material.name);
      setManufacturer(material.manufacturer ?? '');
      setLot(material.lotNumber ?? '');
      setLevel(material.level);
      setTestId(String(material.testId));
      setExpiry(material.expiryDate ?? '');
      setActive(material.active);
      setRows(
        material.targets.map((t) => ({
          parameterId: t.parameterId,
          parameterName: t.parameterName,
          targetMean: String(t.targetMean),
          targetSd: String(t.targetSd),
        })),
      );
    } else {
      setName('');
      setManufacturer('');
      setLot('');
      setLevel('LEVEL_1');
      setTestId('');
      setExpiry('');
      setActive(true);
      setRows([]);
    }
    setError(null);
  }, [open, material]);

  // when the test changes (new material), seed target rows from its numeric params
  useEffect(() => {
    if (material || !selectedTest.data) return;
    setRows(
      selectedTest.data.parameters
        .filter((p) => p.dataType === 'NUMERIC' && !p.calculated)
        .map((p) => ({ parameterId: p.id!, parameterName: p.name, targetMean: '', targetSd: '' })),
    );
  }, [selectedTest.data, material]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        manufacturer: manufacturer.trim() || undefined,
        lotNumber: lot.trim() || undefined,
        level,
        testId: Number(testId),
        expiryDate: expiry || null,
        active,
        targets: rows
          .filter((r) => r.targetMean !== '' && r.targetSd !== '')
          .map((r) => ({
            parameterId: r.parameterId,
            targetMean: Number(r.targetMean),
            targetSd: Number(r.targetSd),
          })),
      };
      if (material) await qcApi.updateMaterial(material.id, body);
      else await qcApi.createMaterial(body);
      toast.success('QC material saved');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={material ? `Edit ${material.name}` : 'New QC material'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={busy} disabled={!name.trim() || !testId} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Material name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label="Test"
            options={[
              { value: '', label: 'Select…' },
              ...(tests.data?.content ?? [])
                .filter((t) => t.type === 'ANALYTE')
                .map((t) => ({ value: String(t.id), label: `${t.code} · ${t.name}` })),
            ]}
            value={testId}
            disabled={!!material}
            onChange={(e) => setTestId(e.target.value)}
          />
          <Input label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          <Input label="Lot number" value={lot} onChange={(e) => setLot(e.target.value)} />
          <Select label="Level" options={LEVELS.map((l) => ({ value: l, label: l.replace('_', ' ') }))} value={level} onChange={(e) => setLevel(e.target.value)} />
          <Input label="Expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <Checkbox label="Active" checked={active} onChange={(e) => setActive(e.target.checked)} />

        <div>
          <p className="mb-1 text-sm font-semibold text-foreground">Assigned targets</p>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">Select a test to load its numeric parameters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr>
                  <th className="py-1">Parameter</th>
                  <th className="py-1">Mean</th>
                  <th className="py-1">SD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.parameterId}>
                    <td className="py-1">{r.parameterName}</td>
                    <td className="py-1">
                      <input
                        type="number"
                        step="any"
                        value={r.targetMean}
                        onChange={(e) =>
                          setRows((p) => p.map((x, j) => (j === i ? { ...x, targetMean: e.target.value } : x)))
                        }
                        className="h-8 w-24 rounded border border-input bg-surface px-2"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        step="any"
                        value={r.targetSd}
                        onChange={(e) =>
                          setRows((p) => p.map((x, j) => (j === i ? { ...x, targetSd: e.target.value } : x)))
                        }
                        className="h-8 w-24 rounded border border-input bg-surface px-2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
