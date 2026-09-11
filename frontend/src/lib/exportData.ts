/**
 * Client-side export helpers for the "master bill" table exports the e-invoice procedure
 * requires (Excel/XML/PDF, from the front-end application itself). CSV opens directly in Excel
 * without a spreadsheet-writing dependency; PDF is covered by the browser's native
 * Print-to-PDF on the app's already-print-formatted pages (invoice detail, sales book).
 */

function download(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
) {
  const lines = [
    columns.map((c) => csvCell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(',')),
  ];
  download(lines.join('\r\n'), 'text/csv;charset=utf-8', filename);
}

function xmlEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportXml<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  rootTag: string,
  rowTag: string,
  filename: string,
) {
  const body = rows
    .map(
      (row) =>
        `  <${rowTag}>\n` +
        columns.map((c) => `    <${c.header}>${xmlEscape(row[c.key])}</${c.header}>`).join('\n') +
        `\n  </${rowTag}>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${body}\n</${rootTag}>`;
  download(xml, 'application/xml;charset=utf-8', filename);
}
