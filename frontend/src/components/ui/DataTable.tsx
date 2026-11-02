import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
  /**
   * Where the row leads. Turns the first cell into a real link — focusable, middle-clickable,
   * openable in a new tab — while clicking anywhere on the row still navigates via `onRowClick`.
   */
  rowHref?: (row: T) => string;
  /** Compact card shown per row on small screens. Falls back to the visible columns stacked. */
  mobileCard?: (row: T) => ReactNode;
}

/** A click that the browser will handle itself (new tab/window) rather than the row handler. */
function opensElsewhere(e: MouseEvent) {
  return e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
}

/**
 * True when the row's own click handler should stand down: the click already landed on a link or
 * button inside the row (which navigates by itself — running both would push twice), or the user
 * was selecting text rather than opening the row.
 */
function handledByChild(e: MouseEvent) {
  if (e.defaultPrevented) return true;
  if ((e.target as Element | null)?.closest('a,button,input,select,textarea,label')) return true;
  return !!window.getSelection()?.toString();
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, rowHref, mobileCard }: DataTableProps<T>) {
  const interactive = !!onRowClick || !!rowHref;

  const rowProps = (row: T) => {
    if (!interactive) return {};
    const href = rowHref?.(row);
    return {
      onClick: (e: MouseEvent) => {
        if (handledByChild(e)) return;
        if (href && opensElsewhere(e)) {
          window.open(href, '_blank', 'noopener');
          return;
        }
        onRowClick?.(row);
      },
      // Middle-click opens a background tab, the way a link would.
      onAuxClick: href
        ? (e: MouseEvent) => {
            if (e.button === 1 && !handledByChild(e)) window.open(href, '_blank', 'noopener');
          }
        : undefined,
    };
  };

  /** The first column carries the link, so every row has one keyboard-reachable way in. */
  const renderCell = (row: T, col: Column<T>, index: number) => {
    const href = index === 0 ? rowHref?.(row) : undefined;
    if (!href) return col.cell(row);
    return (
      <Link
        to={href}
        className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {col.cell(row)}
      </Link>
    );
  };

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
                {...rowProps(row)}
                className={cn('border-b border-border last:border-0', interactive && 'cursor-pointer hover:bg-surface-muted')}
              >
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-foreground', col.hideOnMobile && 'hidden lg:table-cell', col.className)}
                  >
                    {renderCell(row, col, i)}
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
            {...rowProps(row)}
            className={cn('px-4 py-3', interactive && 'cursor-pointer active:bg-surface-muted')}
          >
            {mobileCard ? (
              mobileCard(row)
            ) : (
              <dl className="space-y-1">
                {columns.map((col, i) => (
                  <div key={col.key} className="flex justify-between gap-3 text-sm">
                    <dt className="text-muted">{col.header}</dt>
                    <dd className="text-right text-foreground">{renderCell(row, col, i)}</dd>
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
