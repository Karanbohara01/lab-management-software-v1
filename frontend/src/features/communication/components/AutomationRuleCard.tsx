import { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { communicationApi } from '../api';
import { AUTOMATION_EVENT_DESCRIPTION, type AutomationRule, type SmsTemplate } from '../types';
import { useT } from '@/i18n';

export function AutomationRuleCard({
  rule,
  templates,
  onSaved,
}: {
  rule: AutomationRule;
  templates: SmsTemplate[];
  onSaved: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const [enabled, setEnabled] = useState(rule.enabled);
  const [templateId, setTemplateId] = useState(rule.templateId ? String(rule.templateId) : '');
  const [offsetHours, setOffsetHours] = useState(rule.reminderOffsetHours ? String(rule.reminderOffsetHours) : '24');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(rule.enabled);
    setTemplateId(rule.templateId ? String(rule.templateId) : '');
    setOffsetHours(rule.reminderOffsetHours ? String(rule.reminderOffsetHours) : '24');
  }, [rule]);

  const dirty =
    enabled !== rule.enabled ||
    templateId !== (rule.templateId ? String(rule.templateId) : '') ||
    (rule.eventType === 'APPOINTMENT_REMINDER' && offsetHours !== String(rule.reminderOffsetHours ?? 24));

  const activeTemplates = templates.filter((tpl) => tpl.active);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await communicationApi.automationRules.update(rule.eventType, {
        enabled,
        templateId: templateId ? Number(templateId) : null,
        reminderOffsetHours: rule.eventType === 'APPOINTMENT_REMINDER' ? Number(offsetHours) : null,
      });
      toast.success(t('Automation rule saved'));
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Unable to save this rule'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t(rule.eventLabel)}</p>
            <p className="mt-0.5 text-xs text-muted">{t(AUTOMATION_EVENT_DESCRIPTION[rule.eventType])}</p>
          </div>
          <Badge tone={rule.enabled ? 'success' : 'neutral'}>{t(rule.enabled ? 'Enabled' : 'Disabled')}</Badge>
        </div>

        <Checkbox
          label={t('Send this message automatically')}
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label={t('Template')}
            placeholder={t('Choose a template')}
            options={activeTemplates.map((tpl) => ({ value: String(tpl.id), label: tpl.name }))}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          />
          {rule.eventType === 'APPOINTMENT_REMINDER' && (
            <Input
              type="number"
              min={1}
              label={t('Hours before the appointment')}
              value={offsetHours}
              onChange={(e) => setOffsetHours(e.target.value)}
            />
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <p className="text-xs text-muted">
            {t('{fired} sent · {failed} failed', { fired: rule.firedCount, failed: rule.failedCount })}
          </p>
          <Button size="sm" onClick={save} disabled={!dirty} loading={saving}>
            {t('Save')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
