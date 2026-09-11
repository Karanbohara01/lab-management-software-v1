import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { SectionHeader } from '../SectionHeader';

/** Shared shell for a role's worklist: title, count badge, loading/error/empty states, "view all" link. */
export function QueueShell({
  title,
  description,
  count,
  viewAllTo,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = 'Nothing here right now.',
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  viewAllTo?: string;
  loading: boolean;
  error: string | undefined;
  onRetry: () => void;
  isEmpty: boolean;
  emptyMessage?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <Card className="p-5">
      <SectionHeader
        title={count != null ? `${title} (${count})` : title}
        description={description}
        action={
          viewAllTo ? (
            <Button size="sm" variant="ghost" onClick={() => navigate(viewAllTo)}>
              View all
            </Button>
          ) : undefined
        }
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : isEmpty ? (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
