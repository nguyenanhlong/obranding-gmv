/**
 * Chuẩn hoá dữ liệu số từ BE.
 *
 * Hợp đồng: BE trả số dạng CHUỖI số nguyên ("1234", "1.234", "1234.00") và
 * phần trăm đã nhân 100 (10.9 = 10,9%). Mọi chỗ khác trong FE dùng number và 0..1.
 */

const THOUSANDS = /^-?\d{1,3}(\.\d{3})+$/;

/** "1234" | "1.234" | "1234.00" | 1234 → 1234. Rác/null → 0. */
export function parseIntString(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;

  const raw = value.trim();
  if (!raw) return 0;

  const normalized = THOUSANDS.test(raw) ? raw.replace(/\./g, '') : raw.replace(/,/g, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;

  const rounded = Math.round(parsed);
  return Number.isSafeInteger(rounded) ? rounded : 0;
}

/** Như parseIntString nhưng giữ null (dùng cho previousValue). */
export function parseNullableInt(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  return parseIntString(value);
}

/** 10.9 (%) → 0.109. null giữ null. */
export function percentToRatio(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return value / 100;
}

/** 10.9 (%) → 0.109; null/rác → 0. */
export function percentToRatioOrZero(value: number | null | undefined): number {
  return percentToRatio(value) ?? 0;
}
