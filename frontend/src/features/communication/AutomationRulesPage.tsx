import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { ErrorState, LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { communicationApi } from './api';
import { AutomationRuleCard } from './components/AutomationRuleCard';
import { useT } from '@/i18n';

export function AutomationRulesPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { data: rules, loading, error, refetch } = useQuery(() => communicationApi.automationRules.list(), []);
  const { data: templates } = useQuery(() => communicationApi.templates.list(), []);

  return (
    <>
      <PageHeader
        back={back}
        title={t('Automated notifications')}
        description={t('Every automated SMS is disabled by default — turn on only the ones this clinic wants to send.')}
      />

      {loading && !rules ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rules?.map((rule) => (
            <AutomationRuleCard key={rule.eventType} rule={rule} templates={templates ?? []} onSaved={refetch} />
          ))}
        </div>
      )}
    </>
  );
}
