import { useMemo } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import type { ColumnSuggestion, FieldDefinition } from './types';

export const UNMAPPED = '';

/**
 * Matching the clinic's columns to patient fields.
 *
 * <p>Suggestions are filled in for the administrator but never acted on silently: every column
 * shows what it was matched to and the first few values it holds, so a wrong guess is visible
 * before anything is read. A field can only be fed by one column, so once it is taken it disappears
 * from the other columns' choices — the alternative is discovering the clash after the import.
 */
export function ImportMappingStep({
  columns,
  fields,
  mapping,
  onChange,
  sampleRows,
}: {
  columns: ColumnSuggestion[];
  fields: FieldDefinition[];
  mapping: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  sampleRows: string[][];
}) {
  const t = useT();
  const used = useMemo(() => {
    const byField = new Map<string, number>();
    Object.entries(mapping).forEach(([index, field]) => {
      if (field) byField.set(field, Number(index));
    });
    return byField;
  }, [mapping]);

  const mandatory = fields.filter((f) => f.mandatory);
  const missing = mandatory.filter((f) => !used.has(f.field));
  const hasAgeOrDob = used.has('DATE_OF_BIRTH') || used.has('AGE_YEARS');
  const unmappedCount = columns.filter((c) => !mapping[String(c.index)]).length;

  const optionsFor = (index: number) => [
    { value: UNMAPPED, label: t('Do not import this column') },
    ...fields
      // A field already taken by another column is not offered again.
      .filter((f) => !used.has(f.field) || used.get(f.field) === index)
      .map((f) => ({
        value: f.field,
        label: f.mandatory ? `${t(f.label)} ${t('(required)')}` : t(f.label),
      })),
  ];

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <Alert tone="warning" title={t('Required fields still need a column')}>
          {missing.map((f) => t(f.label)).join(', ')}. {t('Every patient needs at least a name and a gender.')}
        </Alert>
      )}
      {missing.length === 0 && !hasAgeOrDob && (
        <Alert tone="warning" title={t('Map a date of birth or an age')}>
          {t('A patient record needs one of the two. Point a column at whichever your file has.')}
        </Alert>
      )}
      {missing.length === 0 && hasAgeOrDob && (
        <Alert tone="success" title={t('Ready to check the file')}>
          {unmappedCount > 0
            ? t(
                used.size === 1
                  ? '{count} column mapped, {ignored} will be ignored.'
                  : '{count} columns mapped, {ignored} will be ignored.',
                { count: used.size, ignored: unmappedCount },
              )
            : t(used.size === 1 ? '{count} column mapped.' : '{count} columns mapped.', {
                count: used.size,
              })}
        </Alert>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[44rem] text-body-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-left text-label uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">{t('Column in your file')}</th>
              <th className="px-4 py-2.5 font-semibold">{t('First few values')}</th>
              <th className="px-4 py-2.5 font-semibold">{t('Import as')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {columns.map((column) => {
              const selected = mapping[String(column.index)] ?? UNMAPPED;
              const wasSuggested = column.suggestedField && selected === column.suggestedField;
              return (
                <tr key={column.index}>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-foreground">
                      {column.header || <span className="text-muted">{t('(no heading)')}</span>}
                    </span>
                    <span className="block text-caption text-muted">
                      {t('Column {number}', { number: column.index + 1 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {column.examples.length > 0 ? (
                      <span className="line-clamp-2">{column.examples.join(' · ')}</span>
                    ) : (
                      <span className="italic">{t('empty')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Select
                        aria-label={t('Import the column "{header}" as', { header: column.header })}
                        className={cn('min-w-[12rem]', !selected && 'text-muted')}
                        options={optionsFor(column.index)}
                        value={selected}
                        onChange={(e) =>
                          onChange({ ...mapping, [String(column.index)]: e.target.value })
                        }
                      />
                      {wasSuggested && (
                        <span
                          className="flex shrink-0 items-center gap-1 text-caption text-success"
                          title={t('Matched automatically from the column heading')}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          {t('matched')}
                        </span>
                      )}
                      {!selected && column.suggestedField && (
                        <span className="flex shrink-0 items-center gap-1 text-caption text-warning">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          {t('ignored')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sampleRows.length > 0 && (
        <p className="text-caption text-muted">
          {t(
            sampleRows.length === 1
              ? 'Showing the first {count} row of your file. Nothing is imported until you have seen the full check in the next step.'
              : 'Showing the first {count} rows of your file. Nothing is imported until you have seen the full check in the next step.',
            { count: sampleRows.length },
          )}
        </p>
      )}
    </div>
  );
}
