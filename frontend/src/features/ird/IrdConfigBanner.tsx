import { Alert } from '@/components/ui/Alert';
import { useQuery } from '@/hooks/useQuery';
import { useT } from '@/i18n';
import { irdApi } from './api';

/** Honest, always-visible statement of the IRD integration state. */
export function IrdConfigBanner() {
  const t = useT();
  const { data } = useQuery(() => irdApi.config(), []);
  if (!data) return null;

  return (
    <div className="mb-4">
      <Alert tone={data.enabled ? 'info' : 'warning'} title={t('IRD / e-Billing — {environment}', { environment: data.environment })}>
        {data.message}
        {!data.officiallyCertified && (
          <span className="mt-1 block font-medium">
            {t('This system is not IRD-registered or certified. Electronic submission is an integration-ready capability only.')}
          </span>
        )}
      </Alert>
    </div>
  );
}
