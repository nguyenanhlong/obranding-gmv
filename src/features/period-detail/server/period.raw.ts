import type { ReportFilters } from '@/platform/reports/filters';
import {
  addDays,
  bucketOf,
  bucketRange,
  currentHourIn,
  diffDays,
  parseDate,
  todayIn,
  toIsoDate,
} from '@/platform/time';
import { allOrders } from '@/platform/mock/dataset';
import type { RawBucket, RawPeriodSummary } from './period.schema';

/**
 * Dựng response THÔ của API 6 từ dataset mock: số là chuỗi, % ×100,
 * distribution theo đúng unit mà BE quy định cho từng groupBy.
 */

type Row = ReturnType<typeof allOrders>[number];
type Window = { start: string; end: string };

const WEEKDAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function rowsIn(range: Window): Row[] {
  return allOrders().filter((o) => {
    const day = o.placedAt.slice(0, 10);
    return day >= range.start && day <= range.end && o.status !== 'CANCELLED';
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function growthPercentOf(value: number, previous: number): number | null {
  if (previous === 0) return null;
  return round1(((value - previous) / previous) * 100);
}

function shiftPeriodStart(start: string, groupBy: string, units: number): string {
  if (groupBy === 'DAY') return addDays(start, units);
  if (groupBy === 'WEEK') return addDays(start, units * 7);

  const d = parseDate(start);
  const months = groupBy === 'MONTH' ? 1 : groupBy === 'QUARTER' ? 3 : 12;
  d.setUTCMonth(d.getUTCMonth() + units * months);
  return toIsoDate(d);
}

function previousWindow(period: { start: string; end: string }, windowEnd: string, groupBy: string): Window {
  const span = Math.max(1, diffDays(period.start, windowEnd));
  const prevStart = shiftPeriodStart(period.start, groupBy, -1);
  return { start: prevStart, end: addDays(prevStart, span - 1) };
}

/** Mốc bắt đầu của bucket, dùng để xác định isFuture */
function bucketStartOf(bucket: { key: string; index: number }, unit: string, window: Window): string {
  if (unit === 'HOUR') return window.start;
  if (unit === 'MONTH') return `${bucket.key}-01`;
  if (unit === 'WEEK') return bucketRange(bucket.key, 'week').from;
  return bucket.key; // WEEKDAY / DAY: key là ngày
}

function buildDistribution(
  unit: RawPeriodSummary['distribution']['unit'],
  rows: Row[],
  window: Window,
  today: string,
  tz: string,
): RawPeriodSummary['distribution'] {
  const descriptor: { key: string; label: string; shortLabel: string; index: number }[] = [];

  if (unit === 'HOUR') {
    for (let h = 0; h < 24; h += 1) {
      const key = String(h).padStart(2, '0');
      descriptor.push({
        key,
        label: `${h}h–${h + 1}h`,
        shortLabel: `${h}h`,
        index: h,
      });
    }
  } else if (unit === 'MONTH') {
    const [startYear, startMonth] = window.start.split('-').map(Number);
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(Date.UTC(startYear ?? 1970, (startMonth ?? 1) - 1 + i, 1));
      const key = toIsoDate(d).slice(0, 7);
      descriptor.push({
        key,
        label: `Tháng ${d.getUTCMonth() + 1}`,
        shortLabel: `T${d.getUTCMonth() + 1}`,
        index: i,
      });
    }
  } else if (unit === 'WEEK') {
    const seen: string[] = [];
    for (let cursor = window.start; cursor <= window.end; cursor = addDays(cursor, 1)) {
      const key = bucketOf(cursor, 'week');
      if (seen[seen.length - 1] !== key) seen.push(key);
    }
    seen.forEach((key, index) => {
      descriptor.push({
        key,
        label: `Tuần ${index + 1} của quý`,
        shortLabel: `W${index + 1}`,
        index,
      });
    });
  } else if (unit === 'WEEKDAY') {
    for (let cursor = window.start; cursor <= window.end; cursor = addDays(cursor, 1)) {
      const dow = parseDate(cursor).getUTCDay();
      descriptor.push({
        key: cursor,
        label: WEEKDAY_LABEL[dow] ?? '',
        shortLabel: WEEKDAY_LABEL[dow] ?? '',
        index: descriptor.length,
      });
    }
  } else {
    for (let cursor = window.start; cursor <= window.end; cursor = addDays(cursor, 1)) {
      descriptor.push({
        key: cursor,
        label: `Ngày ${Number(cursor.slice(8, 10))}`,
        shortLabel: String(Number(cursor.slice(8, 10))),
        index: descriptor.length,
      });
    }
  }

  const counts = new Map<string, number>();
  for (const o of rows) {
    const day = o.placedAt.slice(0, 10);
    const key =
      unit === 'HOUR'
        ? o.placedAt.slice(11, 13)
        : unit === 'MONTH'
          ? day.slice(0, 7)
          : unit === 'WEEK'
            ? bucketOf(day, 'week')
            : day;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const nowHour = currentHourIn(tz);

  const buckets: RawBucket[] = descriptor.map((d) => {
    const startDate = bucketStartOf(d, unit, window);
    const future =
      today > window.end
        ? false
        : unit === 'HOUR'
          ? window.start === today && d.index > nowHour
          : startDate > today;

    return {
      key: d.key,
      label: d.label,
      shortLabel: d.shortLabel,
      orders: String(counts.get(d.key) ?? 0),
      isFuture: future,
    };
  });

  const peak = buckets
    .filter((b) => !b.isFuture)
    .reduce<RawBucket | null>((best, b) => {
      if (!best) return b;
      if (Number(b.orders) > Number(best.orders)) return b;
      return best;
    }, null);

  return { unit, buckets, peak: peak && Number(peak.orders) > 0 ? peak : null };
}

export function buildRawPeriodSummary(f: ReportFilters): RawPeriodSummary {
  const today = todayIn(f.tz);

  const key = bucketOf(f.from, f.period);
  const range = bucketRange(key, f.period);
  const status: 'FINAL' | 'PROVISIONAL' = range.to >= today ? 'PROVISIONAL' : 'FINAL';
  const windowEnd = status === 'PROVISIONAL' && today < range.to ? today : range.to;
  const window: Window = { start: range.from, end: windowEnd };

  const rows = rowsIn(window);
  const gmv = rows.reduce((acc, o) => acc + o.total.amount, 0);
  const buyers = new Set(rows.map((o) => o.customerId)).size;
  const sellers = new Set(rows.map((o) => o.sellerId)).size;

  const prev = previousWindow({ start: range.from, end: range.to }, windowEnd, f.period.toUpperCase());
  const prevRows = rowsIn(prev);
  const prevGmv = prevRows.reduce((acc, o) => acc + o.total.amount, 0);
  const prevBuyers = new Set(prevRows.map((o) => o.customerId)).size;
  const prevSellers = new Set(prevRows.map((o) => o.sellerId)).size;

  const metric = (value: number, previous: number) => ({
    value: String(value),
    previousValue: String(previous),
    growthPercent: growthPercentOf(value, previous),
  });

  // khách mới: không có đơn hợp lệ nào trước startDate của kỳ
  const firstSeen = new Map<string, string>();
  for (const o of allOrders()) {
    if (o.status === 'CANCELLED') continue;
    const day = o.placedAt.slice(0, 10);
    const current = firstSeen.get(o.customerId);
    if (!current || day < current) firstSeen.set(o.customerId, day);
  }
  const newBuyers = [...new Set(rows.map((o) => o.customerId))].filter((id) => {
    const first = firstSeen.get(id);
    return first !== undefined && first >= range.from;
  }).length;

  const unit: RawPeriodSummary['distribution']['unit'] =
    f.period === 'day'
      ? 'HOUR'
      : f.period === 'week'
        ? 'WEEKDAY'
        : f.period === 'month'
          ? 'DAY'
          : f.period === 'quarter'
            ? 'WEEK'
            : 'MONTH';

  const labelOf = (period: ReportFilters['period'], k: string) => {
    if (period === 'month') {
      const [y, m] = k.split('-');
      return `Tháng ${Number(m)}/${y}`;
    }
    if (period === 'quarter') {
      const [y, q] = k.split('-Q');
      return `Quý ${q}/${y}`;
    }
    if (period === 'week') {
      const [y, w] = k.split('-W');
      return `Tuần ${Number(w)}/${y}`;
    }
    if (period === 'year') return `Năm ${k}`;
    const [y, m, d] = k.split('-');
    return `${d}/${m}/${y}`;
  };

  return {
    period: {
      periodKey: key,
      periodLabel: labelOf(f.period, key),
      groupBy: f.period.toUpperCase() as RawPeriodSummary['period']['groupBy'],
      startDate: range.from,
      endDate: range.to,
      status,
    },
    kpis: {
      orders: metric(rows.length, prevRows.length),
      gmv: metric(gmv, prevGmv),
      buyers: metric(buyers, prevBuyers),
      activeSellers: metric(sellers, prevSellers),
      aov: rows.length === 0 ? '0' : String(Math.round(gmv / rows.length)),
      newBuyers: String(newBuyers),
      newBuyerRate: buyers === 0 ? 0 : round1((newBuyers / buyers) * 100),
    },
    distribution: buildDistribution(unit, rows, window, today, f.tz),
  };
}
