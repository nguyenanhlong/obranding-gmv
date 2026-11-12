import type { Period } from '@/contracts/base';
import { addDays, bucketOf, bucketRange, diffDays } from '@/platform/time';

export type SeriesUnit = 'DAY' | 'MONTH' | 'QUARTER';

export type SeriesBucketShape = {
  key: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
};

function periodOfUnit(unit: SeriesUnit): Period {
  if (unit === 'DAY') return 'day';
  if (unit === 'MONTH') return 'month';
  return 'quarter';
}

/** API 7/8: ≤45 ngày → ngày, ≤400 ngày → tháng, còn lại → quý. */
export function unitForRange(from: string, to: string): SeriesUnit {
  const span = diffDays(from, to);
  if (span <= 45) return 'DAY';
  if (span <= 400) return 'MONTH';
  return 'QUARTER';
}

function labelOf(key: string, unit: SeriesUnit): { label: string; shortLabel: string } {
  if (unit === 'MONTH') {
    const [y, m] = key.split('-');
    return { label: `Tháng ${Number(m)}/${y}`, shortLabel: `T${Number(m)}/${(y ?? '').slice(2)}` };
  }
  if (unit === 'QUARTER') {
    const [y, q] = key.split('-Q');
    return { label: `Quý ${q}/${y}`, shortLabel: `Q${q}/${(y ?? '').slice(2)}` };
  }
  const [y, m, d] = key.split('-');
  return { label: `${d}/${m}/${y}`, shortLabel: `${d}/${m}` };
}

/**
 * Đủ mọi mốc từ mốc chứa `from` đến mốc chứa `to`, mốc đầu/cuối cắt theo khoảng.
 */
export function buildSeriesBuckets(from: string, to: string, unit: SeriesUnit): SeriesBucketShape[] {
  const period = periodOfUnit(unit);
  const keys: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    const key = bucketOf(cursor, period);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }

  return keys.map((key) => {
    const range = bucketRange(key, period);
    const { label, shortLabel } = labelOf(key, unit);
    return {
      key,
      label,
      shortLabel,
      startDate: range.from < from ? from : range.from,
      endDate: range.to > to ? to : range.to,
    };
  });
}
