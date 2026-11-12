import { z } from 'zod';
import type { Period } from '@/contracts/base';
import { addDays, bucketOf, diffDays, todayIn } from '@/platform/time';

export const PERIODS = ['day', 'week', 'month', 'quarter', 'year'] as const;

export type SearchParamsInput = Record<string, string | string[] | undefined>;

/** Filter dùng chung cho M1, M2, M4, M5 — chỉ có kỳ, không có sàn */
export type ReportFilters = {
  from: string;
  to: string;
  period: Period;
  tz: string;
};

export const DEFAULT_PERIOD: Period = 'month';
export const DEFAULT_RANGE_DAYS = 365;
export const MAX_RANGE_DAYS = 1096; // ~3 năm
export const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

export class FilterError extends Error {}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'định dạng YYYY-MM-DD');

const schema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  period: z.enum(PERIODS).catch(DEFAULT_PERIOD),
  tz: z.string().min(1).catch(DEFAULT_TZ),
});

/** Entry point DUY NHẤT. Không nơi nào được tự đọc searchParams rồi parse lại. */
export function parseFilters(input: SearchParamsInput | undefined): ReportFilters {
  const p = schema.parse(input ?? {});
  const to = p.to ?? todayIn(p.tz);
  const from = p.from ?? addDays(to, -(DEFAULT_RANGE_DAYS - 1));

  if (from > to) throw new FilterError('from phải <= to');

  const span = diffDays(from, to);
  if (span > MAX_RANGE_DAYS) throw new FilterError(`tối đa ${MAX_RANGE_DAYS} ngày`);

  return { from, to, period: p.period, tz: p.tz };
}

export function filtersToQueryString(f: ReportFilters): string {
  return new URLSearchParams({
    from: f.from,
    to: f.to,
    period: f.period,
    tz: f.tz,
  }).toString();
}

export function filtersCacheKey(f: ReportFilters): string {
  return JSON.stringify(f);
}

/** URLSearchParams -> object, giữ repeated param */
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

/** Đọc số nguyên dương từ query, có chặn trần */
export function parsePositiveInt(
  value: string | string[] | undefined,
  fallback: number,
  max = 100,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

// ---------------------------------------------------------------- hợp đồng BE

export type GroupBy = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

const GROUP_BY: Record<Period, GroupBy> = {
  day: 'DAY',
  week: 'WEEK',
  month: 'MONTH',
  quarter: 'QUARTER',
  year: 'YEAR',
};

/** Số kỳ tối đa mỗi request, theo API 1 */
export const PERIOD_LIMITS: Record<Period, number> = {
  day: 93,
  week: 104,
  month: 36,
  quarter: 20,
  year: 10,
};

/**
 * URL công khai của FE giữ ?from&to&period; chỉ đổi tên tham số ở ĐÚNG hàm này
 * khi gọi BE. Không nơi nào khác được tự map tên tham số.
 */
export function toApiQuery(f: ReportFilters): {
  fromDate: string;
  toDate: string;
  groupBy: GroupBy;
} {
  return { fromDate: f.from, toDate: f.to, groupBy: GROUP_BY[f.period] };
}

export function countPeriods(f: ReportFilters): number {
  const buckets = new Set<string>();
  let cursor = f.from;
  while (cursor <= f.to) {
    buckets.add(bucketOf(cursor, f.period));
    cursor = addDays(cursor, 1);
  }
  return buckets.size;
}

/** API 1: giới hạn số kỳ theo groupBy, toDate không được sau hôm nay. */
export function assertGrowthRange(f: ReportFilters): void {
  const today = todayIn(f.tz);
  if (f.to > today) throw new FilterError('toDate không được sau ngày hôm nay');

  const periods = countPeriods(f);
  const limit = PERIOD_LIMITS[f.period];
  if (periods > limit) {
    throw new FilterError(
      `Khoảng thời gian quá dài cho groupBy=${GROUP_BY[f.period]}: tối đa ${limit} kỳ (đang có ${periods})`,
    );
  }
}

/** API 6: fromDate ≤ hôm nay, toDate được sau hôm nay, hai đầu phải cùng một kỳ. */
export function assertPeriodRange(f: ReportFilters): void {
  const today = todayIn(f.tz);
  if (f.from > today) throw new FilterError('fromDate không được sau ngày hôm nay');
  if (bucketOf(f.from, f.period) !== bucketOf(f.to, f.period)) {
    throw new FilterError(
      `fromDate và toDate phải thuộc cùng một kỳ ${GROUP_BY[f.period]}`,
    );
  }
}

/** API 7/8: toDate ≤ hôm nay, khoảng tối đa 1.096 ngày. */
export function assertEntityRange(f: ReportFilters): void {
  const today = todayIn(f.tz);
  if (f.to > today) throw new FilterError('toDate không được sau ngày hôm nay');

  const span = diffDays(f.from, f.to);
  if (span > 1096) throw new FilterError('Khoảng thời gian tối đa 1096 ngày');
}
