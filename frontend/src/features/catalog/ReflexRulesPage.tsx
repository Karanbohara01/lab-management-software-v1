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
import { useT, tOpts } from '@/i18n';

const TRIGGER_LABEL: Record<ReflexTrigger, string> = {
  ABNORMAL: 'Any abnormal (LOW/HIGH/ABNORMAL, critical included)',
  CRITICAL: 'Critical only',
};

export function ReflexRulesPage() {
  const t = useT();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.TEST_CATALOG_WRITE);

  const rules = useQuery(() => reflexRulesApi.list(), []);
  const tests = useQuery(() => testCatalogApi.list({ size: 1000, activeOnly: true }), []);
  const testOptions = useMemo(
    () => (tests.data?.content ?? []).map((row) => ({ value: String(row.id), label: `${row.name} (${row.code})` })),
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
      toast.success(t('Reflex rule added'));
      setShowForm(false);
      setNote('');
      rules.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to save'));
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
      toast.error(err instanceof ApiError ? err.message : t('Unable to update'));
    }
  };

  const remove = async (rule: ReflexRule) => {
    try {
      await reflexRulesApi.remove(rule.id);
      toast.success(t('Reflex rule removed'));
      rules.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to delete'));
    }
  };

  return (
    <>
      <PageHeader
        title={t('Reflex testing rules')}
        description={t(
          "When a test's result comes back abnormal or critical, suggest ordering a follow-up test. Suggestion only — nothing is ever auto-ordered or auto-billed; staff see it as a notification and add the test themselves if appropriate.",
        )}
        actions={
          canWrite && (
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('Add rule')}
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-4">
          <CardHeader title={t('New reflex rule')} />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('Source test (the one that was resulted)')}
                value={sourceTestId}
                onChange={(e) => setSourceTestId(e.target.value)}
                options={testOptions}
              />
              <Select
                label={t('Trigger')}
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as ReflexTrigger)}
                options={tOpts(
                  (Object.keys(TRIGGER_LABEL) as ReflexTrigger[]).map((trig) => ({
                    value: trig,
                    label: TRIGGER_LABEL[trig],
                  })),
                )}
              />
              <Select
                label={t('Suggested test')}
                value={targetTestId}
                onChange={(e) => setTargetTestId(e.target.value)}
                options={testOptions}
              />
              <Input
                label={t('Note (optional)')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('e.g. reflex to confirm thyroid status')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t('Cancel')}
              </Button>
              <Button onClick={create} loading={saving}>
                {t('Save rule')}
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
          <EmptyState
            title={t('No reflex rules')}
            message={t('Add a rule to start suggesting follow-up tests automatically.')}
          />
        ) : (
          rules.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-label uppercase text-muted">
                    <th className="px-4 py-2">{t('If this test')}</th>
                    <th className="px-4 py-2">{t('Comes back')}</th>
                    <th className="px-4 py-2">{t('Suggest')}</th>
                    <th className="px-4 py-2">{t('Note')}</th>
                    <th className="px-4 py-2">{t('Status')}</th>
                    {canWrite && <th className="px-4 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {rules.data.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium">{r.sourceTestName ?? `#${r.sourceTestId}`}</td>
                      <td className="px-4 py-2">{r.trigger === 'CRITICAL' ? t('Critical') : t('Abnormal')}</td>
                      <td className="px-4 py-2">{r.targetTestName ?? `#${r.targetTestId}`}</td>
                      <td className="px-4 py-2 text-muted">{r.note ?? '—'}</td>
                      <td className="px-4 py-2">
                        {canWrite ? (
                          <Checkbox label={t(r.active ? 'Active' : 'Inactive')} checked={r.active} onChange={() => toggleActive(r)} />
                        ) : (
                          <Badge tone={r.active ? 'success' : 'neutral'}>{t(r.active ? 'Active' : 'Inactive')}</Badge>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            className="text-muted hover:text-danger"
                            onClick={() => remove(r)}
                            aria-label={t('Delete rule')}
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
