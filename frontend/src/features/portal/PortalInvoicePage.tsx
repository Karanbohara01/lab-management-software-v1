import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { InvoicePrintDocument } from '@/features/billing/InvoicePrintDocument';
import { portalApi } from './api';

/** Public — reuses the same InvoicePrintDocument the authenticated staff view renders, fed from the token-scoped portal endpoint instead of a login-gated one. */
export function PortalInvoicePage() {
  const { token, invoiceId } = useParams<{ token: string; invoiceId: string }>();
  const { data: invoice, loading, error } = useQuery(
    () => portalApi.invoice(token!, Number(invoiceId)),
    [token, invoiceId],
  );

  if (loading && !invoice) return <LoadingState label="Loading invoice…" />;
  if (error) return <ErrorState message={error} />;
  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div data-print-hide className="mb-4 flex items-center gap-2">
          <Link to={`/portal/${token}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
          <div className="flex-1" />
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print / PDF
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-white shadow-card">
          <InvoicePrintDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
