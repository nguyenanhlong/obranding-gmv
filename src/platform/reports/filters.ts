import { z } from 'zod';
import type { CompareMode, Granularity } from '@/contracts/base';

export const GRANULARITIES = ['day', 'week', 'month'] as const;
export const COMPARE_MODES = ['previous_period', 'previous_year', 'none'] as const;

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export type ReportFilters = {
  from: string;
  to: string;
  granularity: Granularity;
  compare: CompareMode;
  marketplaces: string[];
  tz: string;
};

export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;
export const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

export class FilterError extends Error {}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'định dạng YYYY-MM-DD');

const schema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  granularity: z.enum(['day', 'week', 'month']).catch('day'),
  compare: z.enum(['previous_period', 'previous_year', 'none']).catch('previous_period'),
  marketplaces: z.union([z.string(), z.array(z.string())]).optional(),
  tz: z.string().min(1).catch(DEFAULT_TZ),
});

const pad = (n: number) => String(n).padStart(2, '0');

function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-');
  return [Number(y ?? 1970), Number(m ?? 1), Number(d ?? 1)];
}

export function todayIn(tz: string = DEFAULT_TZ): string {
  // en-CA cho ra đúng YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

export function shiftDays(iso: string, days: number): string {
  const [y, m, d] = parseIso(iso);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + days);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function daysBetween(from: string, to: string): number {
  const ms = (iso: string) => {
    const [y, m, d] = parseIso(iso);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000) + 1;
}

export function eachDay(from: string, to: string): string[] {
  const total = daysBetween(from, to);
  if (total <= 0) return [];
  return Array.from({ length: total }, (_, i) => shiftDays(from, i));
}

function normalizeList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : v.split(',');
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/** URLSearchParams -> object, giữ được repeated param (marketplaces=a&marketplaces=b) */
export function searchParamsToRecord(sp: URLSearchParams): SearchParamsInput {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    const first = all[0];
    if (first === undefined) continue;
    out[key] = all.length > 1 ? all : first;
  }
  return out;
}

/**
 * Entry point DUY NHẤT cho mọi page / layout / route handler.
 * Không nơi nào được tự đọc searchParams rồi parse lại.
 */
export function parseFilters(input: SearchParamsInput | undefined): ReportFilters {
  const p = schema.parse(input ?? {});
  const to = p.to ?? todayIn(p.tz);
  const from = p.from ?? shiftDays(to, -(DEFAULT_RANGE_DAYS - 1));

  if (from > to) throw new FilterError('from phải <= to');

  const span = daysBetween(from, to);
  if (span > MAX_RANGE_DAYS) {
    throw new FilterError(`khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày`);
  }

  return {
    from,
    to,
    granularity: p.granularity,
    compare: p.compare,
    marketplaces: normalizeList(p.marketplaces),
    tz: p.tz,
  };
}

/** Giữ filter khi điều hướng / build URL export */
export function filtersToQueryString(f: ReportFilters): string {
  const q = new URLSearchParams({
    from: f.from,
    to: f.to,
    granularity: f.granularity,
    compare: f.compare,
    tz: f.tz,
  });
  for (const m of f.marketplaces) q.append('marketplaces', m);
  return q.toString();
}

/** Key cache ổn định: đổi thứ tự filter không làm hỏng cache */
export function filtersCacheKey(f: ReportFilters): string {
  return JSON.stringify({
    ...f,
    marketplaces: [...f.marketplaces].sort(),
  });
}

/** Kỳ so sánh tương ứng với chế độ đang chọn */
export function comparisonRange(f: ReportFilters): { from: string; to: string } | null {
  if (f.compare === 'none') return null;
  const span = daysBetween(f.from, f.to);
  if (f.compare === 'previous_year') {
    return { from: shiftDays(f.from, -365), to: shiftDays(f.to, -365) };
  }
  return { from: shiftDays(f.from, -span), to: shiftDays(f.to, -span) };
}
