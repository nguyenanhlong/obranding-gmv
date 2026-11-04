/** Excel tiếng Việt cần BOM để không vỡ dấu */
export const UTF8_BOM = '\uFEFF';

export const CSV_HEADERS = {
  'content-type': 'text/csv; charset=utf-8',
  'cache-control': 'no-store',
} as const;

function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T extends object>(rows: readonly T[], columns: ReadonlyArray<keyof T & string>): string {
  const head = columns.join(',');
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c])).join(','));
  return [head, ...body].join('\r\n');
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(UTF8_BOM + csv, {
    headers: {
      ...CSV_HEADERS,
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
