import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page: number; // zero-based
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, onPageChange }: PaginationProps) {
  if (totalElements === 0) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm">
      <p className="text-muted">
        Page <span className="font-medium text-foreground">{page + 1}</span> of{' '}
        <span className="font-medium text-foreground">{Math.max(totalPages, 1)}</span>
        <span className="hidden sm:inline"> · {totalElements} total</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
