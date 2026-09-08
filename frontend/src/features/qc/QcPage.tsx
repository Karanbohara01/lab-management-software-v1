import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { qcApi } from './api';
import type { LeveyJennings, QcControlState, QcMaterial } from './types';
import { QcMaterialModal } from './QcMaterialModal';
import { LeveyJenningsChart } from './LeveyJenningsChart';

const STATE_TONE: Record<QcControlState, 'success' | 'warning' | 'danger' | 'neutral'> = {
  IN_CONTROL: 'success',
  WARNING: 'warning',
  OUT_OF_CONTROL: 'danger',
  NOT_ESTABLISHED: 'neutral',
  NOT_CONFIGURED: 'neutral',
};

export function QcPage() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.TEST_CATALOG_WRITE);
  const canRun = hasPermission(PERMISSIONS.RESULT_ENTER);

  const materials = useQuery(() => qcApi.materials(), []);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QcMaterial | null>(null);

  const selected = useMemo(
    () => materials.data?.find((m) => m.id === selectedId) ?? materials.data?.[0] ?? null,
    [materials.data, selectedId],
  );

  const [paramId, setParamId] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [analyzer, setAnalyzer] = useState('');
  const [shift, setShift] = useState('');
  const [busy, setBusy] = useState(false);
  const [lj, setLj] = useState<LeveyJennings | null>(null);

  const status = useQuery(
    () => (selected ? qcApi.status(selected.testId) : Promise.resolve(null)),
    [selected?.testId],
  );
  const runs = useQuery(
    () => (selected ? qcApi.runs(selected.testId, 40) : Promise.resolve([])),
    [selected?.testId, busy],
  );

  useEffect(() => {
    setParamId(selected?.targets[0]?.parameterId ?? null);
  }, [selected?.id]);

  useEffect(() => {
    if (selected && paramId) {
      qcApi.leveyJennings(selected.id, paramId).then(setLj).catch(() => setLj(null));
    } else {
      setLj(null);
    }
  }, [selected?.id, paramId, busy]);

  const record = async () => {
    if (!selected || !paramId || value === '') return;
    setBusy(true);
    try {
      const run = await qcApi.recordRun({
        materialId: selected.id,
        parameterId: paramId,
        value: Number(value),
        analyzer: analyzer || undefined,
        shift: shift || undefined,
      });
      if (run.status === 'REJECTED') toast.error(`QC REJECTED — ${run.violatedRules}`);
      else if (run.status === 'WARNING') toast.error(`QC warning — ${run.violatedRules}`);
      else toast.success('QC in control');
      setValue('');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Unable to record QC');
    } finally {
      setBusy(false);
    }
  };

  const accept = async (id: number) => {
    try {
      await qcApi.acceptRun(id);
      toast.success('Run accepted');
      setBusy((b) => !b);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed');
    }
  };

  if (materials.loading && !materials.data) return <LoadingState label="Loading QC…" />;

  return (
    <>
      <PageHeader
        title="Quality control"
        description="QC materials, Westgard-rule evaluation and Levey-Jennings charts."
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New material
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Card>
          <CardHeader title="Materials" />
          <CardBody className="space-y-1">
            {(materials.data ?? []).length === 0 && <p className="text-sm text-muted">No QC materials yet.</p>}
            {(materials.data ?? []).map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${
                  selected?.id === m.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-muted'
                }`}
              >
                <span className="font-medium">{m.name}</span>
                <span className="ml-1 text-xs text-muted">
                  {m.level.replace('_', ' ')} · {m.testCode}
                </span>
              </button>
            ))}
          </CardBody>
        </Card>

        {selected && (
          <div className="space-y-4">
            <Card>
              <CardHeader
                title={`${selected.name} · ${selected.testCode}`}
                action={
                  <div className="flex items-center gap-2">
                    {status.data && (
                      <Badge tone={STATE_TONE[status.data.state]}>{status.data.state.replace(/_/g, ' ')}</Badge>
                    )}
                    {canManage && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(selected);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                }
              />
              <CardBody className="space-y-3">
                {status.data && status.data.messages.length > 0 && (
                  <Alert tone={status.data.state === 'OUT_OF_CONTROL' ? 'danger' : 'warning'}>
                    <ul className="list-disc pl-4">
                      {status.data.messages.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <Select
                    label="Parameter"
                    className="w-44"
                    options={selected.targets.map((t) => ({
                      value: String(t.parameterId),
                      label: `${t.parameterName} (${t.targetMean}±${t.targetSd})`,
                    }))}
                    value={paramId ? String(paramId) : ''}
                    onChange={(e) => setParamId(Number(e.target.value))}
                  />
                  <Input label="Value" type="number" step="any" className="w-28" value={value} onChange={(e) => setValue(e.target.value)} />
                  <Input label="Analyzer" className="w-32" value={analyzer} onChange={(e) => setAnalyzer(e.target.value)} />
                  <Input label="Shift" className="w-24" value={shift} onChange={(e) => setShift(e.target.value)} />
                  {canRun && (
                    <Button onClick={record} loading={busy} disabled={!paramId || value === ''}>
                      Record QC
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            {lj && lj.points.length > 0 && (
              <Card>
                <CardHeader title="Levey-Jennings" />
                <CardBody>
                  <LeveyJenningsChart data={lj} />
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader title="Recent QC runs" />
              <CardBody>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="py-1">When</th>
                      <th className="py-1">Parameter</th>
                      <th className="py-1">Value</th>
                      <th className="py-1">z</th>
                      <th className="py-1">Status</th>
                      <th className="py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {(runs.data ?? []).map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="py-1 text-muted">{new Date(r.runAt).toLocaleString()}</td>
                        <td className="py-1">{r.parameterName}</td>
                        <td className="py-1 font-medium">{r.value}</td>
                        <td className="py-1">{r.zScore ?? '—'}</td>
                        <td className="py-1">
                          <Badge
                            tone={r.status === 'REJECTED' ? 'danger' : r.status === 'WARNING' ? 'warning' : 'success'}
                          >
                            {r.status.replace('_', ' ')}
                          </Badge>
                          {r.violatedRules && <span className="ml-1 text-xs text-muted">{r.violatedRules}</span>}
                          {r.accepted && <span className="ml-1 text-xs text-muted">(accepted)</span>}
                        </td>
                        <td className="py-1">
                          {r.status === 'REJECTED' && !r.accepted && hasPermission(PERMISSIONS.RESULT_VERIFY) && (
                            <button className="text-xs text-primary hover:underline" onClick={() => accept(r.id)}>
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      <QcMaterialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        material={editing}
        onSaved={materials.refetch}
      />
    </>
  );
}
