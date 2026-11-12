import type { ReportFilters } from '@/platform/reports/filters';
import { addDays, bucketOf, bucketRange, diffDays, todayIn } from '@/platform/time';
import { allOrders } from '@/platform/mock/dataset';
import type { RawGrowthPeriod, RawGrowthResponse } from './growth.schema';

/**
 * Dựng response THÔ đúng shape API 1 từ dataset mock (số là chuỗi, % ×100).
 * Nhờ vậy mock và BE đi qua cùng một mapper — không lệch định dạng.
 */

type Window = { start: string; end: string };

function daysIn(from: string, to: string): string[] {
  const out: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

function periodsOf(f: ReportFilters): { key: string; start: string; end: string }[] {
  const firstStart = bucketRange(bucketOf(f.from, f.period), f.period).from;
  const lastEnd = bucketRange(bucketOf(f.to, f.period), f.period).to;

  const keys: string[] = [];
  for (const day of daysIn(firstStart, lastEnd)) {
    const key = bucketOf(day, f.period);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }
  return keys.map((key) => {
    const range = bucketRange(key, f.period);
    return { key, start: range.from, end: range.to };
  });
}

function ordersIn(range: Window) {
  return allOrders().filter((o) => {
    const day = o.placedAt.slice(0, 10);
    return day >= range.start && day <= range.end && o.status !== 'CANCELLED';
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function growthPercentOf(value: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return round1(((value - previous) / previous) * 100);
}

type Totals = { orders: number; gmv: number; buyers: number; sellers: number };

function totalsOf(rows: ReturnType<typeof ordersIn>): Totals {
  const gmv = rows.reduce((acc, o) => acc + o.total.amount, 0);
  return {
    orders: rows.length,
    gmv,
    buyers: new Set(rows.map((o) => o.customerId)).size,
    sellers: new Set(rows.map((o) => o.sellerId)).size,
  };
}

/** Kỳ so sánh: kỳ trước đầy đủ, hoặc đoạn tương ứng nếu kỳ hiện tại là PROVISIONAL. */
function previousWindow(
  index: number,
  periods: { key: string; start: string; end: string }[],
  status: 'FINAL' | 'PROVISIONAL',
  today: string,
  period: ReportFilters['period'],
): Window | null {
  // Kỳ đầu tiên trong khoảng vẫn có kỳ liền trước — lùi 1 bucket là xong.
  const prev = periods[index - 1] ?? (() => {
    const current = periods[index];
    if (!current) return null;
    const bucket = bucketOf(addDays(current.start, -1), period);
    const range = bucketRange(bucket, period);
    return { key: bucket, start: range.from, end: range.to };
  })();
  if (!prev) return null;
  if (status === 'FINAL') return { start: prev.start, end: prev.end };

  const current = periods[index];
  if (!current) return { start: prev.start, end: prev.end };
  const elapsed = Math.max(1, diffDays(current.start, today < current.end ? today : current.end));
  return { start: prev.start, end: addDays(prev.start, elapsed - 1) };
}

export function buildRawGrowthReport(f: ReportFilters): RawGrowthResponse {
  const today = todayIn(f.tz);
  const periods = periodsOf(f);

  const rows = periods.map((p, index) => {
    const status: 'FINAL' | 'PROVISIONAL' = p.end >= today ? 'PROVISIONAL' : 'FINAL';
    const window: Window = {
      start: p.start,
      end: status === 'PROVISIONAL' && today < p.end ? today : p.end,
    };

    const current = ordersIn(window);
    const now = totalsOf(current);

    const prevWindow = previousWindow(index, periods, status, today, f.period);
    const prev = prevWindow ? totalsOf(ordersIn(prevWindow)) : null;

    const metric = (value: number, previous: number | null) => ({
      value: String(value),
      previousValue: previous === null ? null : String(previous),
      growthPercent: growthPercentOf(value, previous),
    });

    // top sellers theo số đơn
    const bySeller = new Map<string, { orders: number; gmv: number; row: (typeof current)[number] }>();
    for (const o of current) {
      const entry = bySeller.get(o.sellerId);
      if (entry) {
        entry.orders += 1;
        entry.gmv += o.total.amount;
      } else {
        bySeller.set(o.sellerId, { orders: 1, gmv: o.total.amount, row: o });
      }
    }

    // số đơn kỳ trước của từng nhà bán (để tính % tăng trưởng của top)
    const prevSellerOrders = prevWindow
      ? ordersIn(prevWindow).reduce((acc, o) => {
          acc.set(o.sellerId, (acc.get(o.sellerId) ?? 0) + 1);
          return acc;
        }, new Map<string, number>())
      : null;

    const topSellers = [...bySeller.entries()]
      .sort((a, b) => (b[1].orders - a[1].orders) || (b[1].gmv - a[1].gmv) || (a[0] < b[0] ? -1 : 1))
      .slice(0, 10)
      .map(([sellerId, entry]) => ({
        sellerId,
        sellerCode: entry.row.sellerCode,
        sellerName: entry.row.sellerName,
        category: entry.row.category,
        orders: String(entry.orders),
        gmv: String(entry.gmv),
        orderShare: now.orders === 0 ? 0 : round1((entry.orders / now.orders) * 100),
        growthPercent:
          prevSellerOrders === null
            ? null
            : growthPercentOf(entry.orders, prevSellerOrders.get(sellerId) ?? 0),
      }));

    const buyers = new Map<string, { orders: number; value: number; name: string }>();
    for (const o of current) {
      const entry = buyers.get(o.customerId);
      if (entry) {
        entry.orders += 1;
        entry.value += o.total.amount;
      } else {
        buyers.set(o.customerId, { orders: 1, value: o.total.amount, name: o.customerName });
      }
    }
    const buyerList = [...buyers.entries()].map(([customerId, entry]) => ({
      customerId,
      customerName: entry.name,
      orders: String(entry.orders),
      value: String(entry.value),
    }));

    const period: RawGrowthPeriod = {
      periodKey: p.key,
      periodLabel: labelOf(p.key, f.period),
      startDate: p.start,
      endDate: p.end,
      status,
      orders: metric(now.orders, prev ? prev.orders : null),
      buyers: metric(now.buyers, prev ? prev.buyers : null),
      gmv: metric(now.gmv, prev ? prev.gmv : null),
      activeSellers: metric(now.sellers, prev ? prev.sellers : null),
      aov: now.orders === 0 ? '0' : String(Math.round(now.gmv / now.orders)),
      topBuyersByOrders: [...buyerList].sort((a, b) => Number(b.orders) - Number(a.orders) || Number(b.value) - Number(a.value)).slice(0, 10),
      topBuyersByValue: [...buyerList].sort((a, b) => Number(b.value) - Number(a.value) || Number(b.orders) - Number(a.orders)).slice(0, 10),
      topSellersByOrders: topSellers,
    };
    return period;
  });

  return {
    meta: {
      startDate: periods[0]?.start ?? f.from,
      endDate: periods[periods.length - 1]?.end ?? f.to,
      groupBy: f.period.toUpperCase() as RawGrowthResponse['meta']['groupBy'],
      totalPeriods: periods.length,
    },
    periods: rows,
  };
}

function labelOf(key: string, period: ReportFilters['period']): string {
  if (period === 'month') {
    const [y, m] = key.split('-');
    return `Tháng ${Number(m)}/${y}`;
  }
  if (period === 'quarter') {
    const [y, q] = key.split('-Q');
    return `Quý ${q}/${y}`;
  }
  if (period === 'week') {
    const [y, w] = key.split('-W');
    return `Tuần ${Number(w)}/${y}`;
  }
  if (period === 'year') return `Năm ${key}`;
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}
