import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell content for the desktop table. */
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide this column below the `lg` breakpoint. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Compact card shown per row on small screens. Falls back to the visible columns stacked. */
  mobileCard?: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, mobileCard }: DataTableProps<T>) {
  return (
    <>
      {/* Desktop / tablet: real table inside a horizontal-scroll container */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3', col.hideOnMobile && 'hidden lg:table-cell', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-surface-muted',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-foreground', col.hideOnMobile && 'hidden lg:table-cell', col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn('px-4 py-3', onRowClick && 'cursor-pointer active:bg-surface-muted')}
          >
            {mobileCard ? (
              mobileCard(row)
            ) : (
              <dl className="space-y-1">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-3 text-sm">
                    <dt className="text-muted">{col.header}</dt>
                    <dd className="text-right text-foreground">{col.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
