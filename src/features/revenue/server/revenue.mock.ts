import 'server-only';
import { comparisonRange, daysBetween, eachDay } from '@/platform/reports/filters';
import type { ReportFilters } from '@/platform/reports/filters';
import type { Delta } from '@/contracts/base';
import { deltaOf } from './revenue.mapper';
import { revenueSeries, type DailyRevenue } from './fixture';
import { MARKETPLACES } from '@/platform/reports/fixtures/marketplaces';
import type { MarketplaceRevenue, RevenueSource, TimeseriesPoint } from '../contracts';

function slice(from: string, to: string): DailyRevenue[] {
  return revenueSeries().filter((d) => d.date >= from && d.date <= to);
}

function sum(rows: readonly DailyRevenue[], pick: (d: DailyRevenue) => number): number {
  return rows.reduce((acc, d) => acc + pick(d), 0);
}

function bucketKey(date: string, granularity: ReportFilters['granularity']): string {
  if (granularity === 'month') return date.slice(0, 7);
  if (granularity === 'week') {
    const [y, m, d] = date.split('-').map(Number);
    const t = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
    const dow = (t.getUTCDay() + 6) % 7; // thứ 2 = 0
    t.setUTCDate(t.getUTCDate() - dow);
    const iso = t.toISOString().slice(0, 10);
    return iso;
  }
  return date;
}

function aggregate(rows: readonly DailyRevenue[], granularity: ReportFilters['granularity']) {
  const map = new Map<string, { gmv: number; orders: number; buyers: number }>();

  for (const row of rows) {
    const key = bucketKey(row.date, granularity);
    const acc = map.get(key) ?? { gmv: 0, orders: 0, buyers: 0 };
    acc.gmv += row.gmv;
    acc.orders += row.orders;
    acc.buyers += row.buyers;
    map.set(key, acc);
  }

  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([bucket, v]) => ({ bucket, ...v }));
}

function deltaWithRange(current: number, previous: number | null, f: ReportFilters): Delta {
  const base = deltaOf(current, previous);
  const cmp = comparisonRange(f);
  return cmp ? { ...base, compareTo: cmp } : base;
}

export const revenueMockSource: RevenueSource = {
  async getSummary(f) {
    const rows = slice(f.from, f.to);
    const gmv = sum(rows, (d) => d.gmv);
    const orders = sum(rows, (d) => d.orders);

    const cmp = comparisonRange(f);
    const prevRows = cmp ? slice(cmp.from, cmp.to) : [];
    const prevGmv = cmp ? sum(prevRows, (d) => d.gmv) : null;
    const prevOrders = cmp ? sum(prevRows, (d) => d.orders) : null;

    const span = Math.max(1, daysBetween(f.from, f.to));
    const perDay = gmv / span;
    const prevPerDay = prevGmv === null ? null : prevGmv / span;

    return {
      range: { from: f.from, to: f.to },
      gmv: { amount: gmv, currency: 'VND' },
      gmvDelta: deltaWithRange(gmv, prevGmv, f),
      orderCount: orders,
      orderCountDelta: deltaWithRange(orders, prevOrders, f),
      gmvPerDay: { amount: Math.round(perDay), currency: 'VND' },
      growthRate: span < 2 || prevPerDay === null || prevPerDay === 0 ? null : perDay / prevPerDay - 1,
    };
  },

  async getTimeseries(f) {
    const rows = slice(f.from, f.to);
    const points: TimeseriesPoint[] = aggregate(rows, f.granularity).map((p) => ({
      bucket: p.bucket,
      gmv: p.gmv,
      orders: p.orders,
      buyers: p.buyers,
      gmvPrev: null,
    }));

    const cmp = comparisonRange(f);
    if (!cmp) return points;

    const prevPoints = new Map(
      aggregate(slice(cmp.from, cmp.to), f.granularity).map((p) => [p.bucket, p.gmv]),
    );
    const prevValues = [...prevPoints.values()];

    return points.map((p, i) => ({ ...p, gmvPrev: prevValues[i] ?? null }));
  },

  async getByMarketplace(f): Promise<MarketplaceRevenue[]> {
    const rows = slice(f.from, f.to);
    const total = sum(rows, (d) => d.gmv);

    const cmp = comparisonRange(f);
    const prevRows = cmp ? slice(cmp.from, cmp.to) : [];

    return MARKETPLACES.map((mp) => {
      const gmv = sum(rows, (d) => d.byMarketplace[mp.id] ?? 0);
      const prevGmv = cmp ? sum(prevRows, (d) => d.byMarketplace[mp.id] ?? 0) : null;
      const base = deltaOf(gmv, prevGmv);

      return {
        marketplace: mp,
        gmv: { amount: gmv, currency: 'VND' as const },
        share: total === 0 ? 0 : gmv / total,
        delta: cmp ? { ...base, compareTo: cmp } : base,
      };
    }).sort((a, b) => b.gmv.amount - a.gmv.amount);
  },
};

/** Dùng cho test: đảm bảo fixture đủ dài cho mọi kỳ so sánh */
export function fixtureSpan(): number {
  const days = eachDay('2026-01-01', '2026-12-31');
  return days.length;
}
