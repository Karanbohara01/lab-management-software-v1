import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { useT } from '@/i18n';

export interface PaginationProps {
  page: number; // zero-based
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, onPageChange }: PaginationProps) {
  const t = useT();
  if (totalElements === 0) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm">
      <p className="text-muted">
        {t('Page {page} of {totalPages}', { page: page + 1, totalPages: Math.max(totalPages, 1) })}
        <span className="hidden sm:inline"> · {t('{total} total', { total: totalElements })}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label={t('Previous page')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t('Prev')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          aria-label={t('Next page')}
        >
          {t('Next')}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
