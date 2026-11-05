import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/money';
import { EmptyState } from '@/components/ui/PageState';
import { getLocale, LOCALE_TAG, useT } from '@/i18n';

export interface MoneyColumn<T> {
  key: string;
  header: ReactNode;
  /** Rendered cell. Omit for a numeric column and `amount` will render it right-aligned. */
  cell?: (row: T) => ReactNode;
  /** The number this column shows — makes the column sortable and, with `total`, footable. */
  amount?: (row: T) => number;
  /** How that number reads. Counts are whole things and must not be dressed up as money. */
  format?: 'money' | 'count';
  /** A non-money sortable value (a name, a count, a date string). */
  sortValue?: (row: T) => string | number;
  /** Show a column total in the footer. */
  total?: boolean;
  align?: 'left' | 'right';
  className?: string;
  hideOnMobile?: boolean;
}

/**
 * The financial table used across the revenue module and its printout: right-aligned tabular
 * figures, client-side sorting, and a totals row summed from the raw values rather than from the
 * rounded cells, so the footer always agrees with the data.
 *
 * Deliberately not `DataTable`: these rows are not navigable records, they need column totals and
 * sortable headers, and the printed version must keep its `<thead>` so it repeats on every page.
 */
export function MoneyTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  initialSort,
  sortable = true,
  footerLabel,
  maxRows,
  className,
}: {
  columns: MoneyColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  initialSort?: { key: string; descending?: boolean };
  sortable?: boolean;
  footerLabel?: string;
  /** Show only the top N rows, with the footer still totalling every row. */
  maxRows?: number;
  className?: string;
}) {
  const t = useT();
  const resolvedEmptyMessage = emptyMessage ?? t('Nothing in this period.');
  const resolvedFooterLabel = footerLabel ?? t('Total');
  const count = useMemo(() => new Intl.NumberFormat(LOCALE_TAG[getLocale()], { maximumFractionDigits: 0 }), [getLocale()]);
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(
    initialSort ? { key: initialSort.key, descending: initialSort.descending ?? true } : null,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const value = col?.amount ?? col?.sortValue;
    if (!value) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort.descending ? -cmp : cmp;
    });
    return copy;
  }, [rows, sort, columns]);

  const visible = maxRows ? sorted.slice(0, maxRows) : sorted;
  const hasTotals = columns.some((c) => c.total);
  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const col of columns) {
      if (col.total && col.amount) out[col.key] = rows.reduce((s, r) => s + (col.amount!(r) || 0), 0);
    }
    return out;
  }, [rows, columns]);

  if (rows.length === 0) return <EmptyState title={t('No data')} message={resolvedEmptyMessage} />;

  const headerCell = (col: MoneyColumn<T>) => {
    const right = col.align === 'right' || (!col.align && !!col.amount);
    const canSort = sortable && !!(col.amount || col.sortValue);
    const active = sort?.key === col.key;
    const content = (
      <span className={cn('inline-flex items-center gap-1', right && 'flex-row-reverse')}>
        {col.header}
        {canSort && (
          <span aria-hidden className="print:hidden">
            {!active ? (
              <ChevronsUpDown className="h-3 w-3 opacity-40" />
            ) : sort!.descending ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )}
          </span>
        )}
      </span>
    );
    return (
      <th
        key={col.key}
        scope="col"
        aria-sort={active ? (sort!.descending ? 'descending' : 'ascending') : canSort ? 'none' : undefined}
        className={cn(
          'px-3 py-2 text-label uppercase tracking-wide text-muted',
          right ? 'text-right' : 'text-left',
          col.hideOnMobile && 'hidden lg:table-cell',
          col.className,
        )}
      >
        {canSort ? (
          <button
            type="button"
            onClick={() => setSort((s) => (s?.key === col.key ? { key: col.key, descending: !s.descending } : { key: col.key, descending: true }))}
            className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {content}
          </button>
        ) : (
          content
        )}
      </th>
    );
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-body-sm">
        <thead className="border-b border-border">
          <tr>{columns.map(headerCell)}</tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-0">
              {columns.map((col) => {
                const right = col.align === 'right' || (!col.align && !!col.amount);
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2 text-foreground',
                      right && 'text-right tabular-nums',
                      col.hideOnMobile && 'hidden lg:table-cell',
                      col.className,
                    )}
                  >
                    {col.cell
                      ? col.cell(row)
                      : col.amount
                        ? col.format === 'count'
                          ? count.format(col.amount(row))
                          : formatAmount(col.amount(row))
                        : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {hasTotals && (
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              {columns.map((col, i) => {
                const right = col.align === 'right' || (!col.align && !!col.amount);
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2 text-foreground',
                      right && 'text-right tabular-nums',
                      col.hideOnMobile && 'hidden lg:table-cell',
                      col.className,
                    )}
                  >
                    {col.total && col.amount
                      ? col.format === 'count'
                        ? count.format(totals[col.key] ?? 0)
                        : formatAmount(totals[col.key] ?? 0)
                      : i === 0
                        ? `${resolvedFooterLabel}${maxRows && rows.length > maxRows ? ` ${t('(all {count})', { count: rows.length })}` : ''}`
                        : null}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
      {maxRows && rows.length > maxRows && (
        <p className="px-3 py-2 text-caption text-muted print:hidden">
          {t('Showing the top {shown} of {total}. The total above covers all of them.', { shown: maxRows, total: rows.length })}
        </p>
      )}
    </div>
  );
}
