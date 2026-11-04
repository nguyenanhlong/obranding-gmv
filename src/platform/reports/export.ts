const SUPPORTED = new Set(['csv']);

/**
 * TODO: XLSX và PDF đang trả 501. Cần chốt thư viện (exceljs / pdfkit) trước khi làm.
 * Trả về Response nếu format chưa hỗ trợ, null nếu được phép đi tiếp.
 */
export function rejectUnsupportedFormat(format: string | null | undefined): Response | null {
  const f = (format ?? 'csv').toLowerCase();
  if (SUPPORTED.has(f)) return null;

  return Response.json(
    {
      error: `Chưa hỗ trợ định dạng ${f.toUpperCase()}`,
      supported: [...SUPPORTED],
    },
    { status: 501 },
  );
}
