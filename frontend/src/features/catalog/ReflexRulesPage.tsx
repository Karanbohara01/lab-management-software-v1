import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { testCatalogApi } from './api';
import { reflexRulesApi, type ReflexRule, type ReflexTrigger } from './reflexRules';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';

const TRIGGER_LABEL: Record<ReflexTrigger, string> = {
  ABNORMAL: 'Any abnormal (LOW/HIGH/ABNORMAL, critical included)',
  CRITICAL: 'Critical only',
};

export function ReflexRulesPage() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.TEST_CATALOG_WRITE);

  const rules = useQuery(() => reflexRulesApi.list(), []);
  const tests = useQuery(() => testCatalogApi.list({ size: 1000, activeOnly: true }), []);
  const testOptions = useMemo(
    () => (tests.data?.content ?? []).map((t) => ({ value: String(t.id), label: `${t.name} (${t.code})` })),
    [tests.data],
  );

  const [showForm, setShowForm] = useState(false);
  const [sourceTestId, setSourceTestId] = useState('');
  const [trigger, setTrigger] = useState<ReflexTrigger>('ABNORMAL');
  const [targetTestId, setTargetTestId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (testOptions.length === 0) return;
    if (!sourceTestId) setSourceTestId(testOptions[0]!.value);
    if (!targetTestId) setTargetTestId(testOptions[0]!.value);
  }, [testOptions, sourceTestId, targetTestId]);

  const create = async () => {
    if (!sourceTestId || !targetTestId) return;
    setSaving(true);
    try {
      await reflexRulesApi.create({
        sourceTestId: Number(sourceTestId),
        trigger,
        targetTestId: Number(targetTestId),
        note: note || undefined,
      });
      toast.success('Reflex rule added');
      setShowForm(false);
      setNote('');
      rules.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: ReflexRule) => {
    try {
      await reflexRulesApi.update(rule.id, {
        trigger: rule.trigger,
        targetTestId: rule.targetTestId,
        note: rule.note ?? undefined,
        active: !rule.active,
      });
      rules.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to update');
    }
  };

  const remove = async (rule: ReflexRule) => {
    try {
      await reflexRulesApi.remove(rule.id);
      toast.success('Reflex rule removed');
      rules.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete');
    }
  };

  return (
    <>
      <PageHeader
        title="Reflex testing rules"
        description="When a test's result comes back abnormal or critical, suggest ordering a follow-up test. Suggestion only — nothing is ever auto-ordered or auto-billed; staff see it as a notification and add the test themselves if appropriate."
        actions={
          canWrite && (
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add rule
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-4">
          <CardHeader title="New reflex rule" />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Source test (the one that was resulted)"
                value={sourceTestId}
                onChange={(e) => setSourceTestId(e.target.value)}
                options={testOptions}
              />
              <Select
                label="Trigger"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as ReflexTrigger)}
                options={(Object.keys(TRIGGER_LABEL) as ReflexTrigger[]).map((t) => ({ value: t, label: TRIGGER_LABEL[t] }))}
              />
              <Select
                label="Suggested test"
                value={targetTestId}
                onChange={(e) => setTargetTestId(e.target.value)}
                options={testOptions}
              />
              <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. reflex to confirm thyroid status" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={create} loading={saving}>
                Save rule
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        {rules.loading && !rules.data ? (
          <LoadingState />
        ) : rules.error ? (
          <ErrorState message={rules.error} onRetry={rules.refetch} />
        ) : rules.data && rules.data.length === 0 ? (
          <EmptyState title="No reflex rules" message="Add a rule to start suggesting follow-up tests automatically." />
        ) : (
          rules.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-2">If this test</th>
                    <th className="px-4 py-2">Comes back</th>
                    <th className="px-4 py-2">Suggest</th>
                    <th className="px-4 py-2">Note</th>
                    <th className="px-4 py-2">Status</th>
                    {canWrite && <th className="px-4 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {rules.data.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium">{r.sourceTestName ?? `#${r.sourceTestId}`}</td>
                      <td className="px-4 py-2">{r.trigger === 'CRITICAL' ? 'Critical' : 'Abnormal'}</td>
                      <td className="px-4 py-2">{r.targetTestName ?? `#${r.targetTestId}`}</td>
                      <td className="px-4 py-2 text-muted">{r.note ?? '—'}</td>
                      <td className="px-4 py-2">
                        {canWrite ? (
                          <Checkbox label={r.active ? 'Active' : 'Inactive'} checked={r.active} onChange={() => toggleActive(r)} />
                        ) : (
                          <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            className="text-muted hover:text-danger"
                            onClick={() => remove(r)}
                            aria-label="Delete rule"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>
    </>
  );
}
