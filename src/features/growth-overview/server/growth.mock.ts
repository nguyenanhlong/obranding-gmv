import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { previousRange } from '@/platform/time';
import { deltaOf, filterRange, groupBy, totalsOf } from '@/platform/mock/aggregate';
import { allOrders } from '@/platform/mock/dataset';
import { bucketOf, bucketRange } from '@/platform/time';
import type { GrowthPoint, GrowthReport, KpiValue, TopSeller } from '../contracts';

function buildSeries(from: string, to: string, period: ReportFilters['period']): GrowthPoint[] {
  const orders = filterRange(allOrders(), from, to);
  const prev = previousRange(from, to);
  const prevOrders = filterRange(allOrders(), prev.from, prev.to);

  const current = groupBy(orders, (o) => bucketOf(o.placedAt.slice(0, 10), period));
  const previous = groupBy(prevOrders, (o) => bucketOf(o.placedAt.slice(0, 10), period));

  const currentBuckets = [...current.keys()].sort();
  const previousTotals = [...previous.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, rows]) => totalsOf(rows).orders);

  const today = new Date().toISOString().slice(0, 10);

  return currentBuckets.map((bucket, i) => {
    const totals = totalsOf(current.get(bucket) ?? []);
    const prevOrdersCount = previousTotals[i] ?? 0;
    const growthPct =
      prevOrdersCount === 0 ? null : (totals.orders - prevOrdersCount) / prevOrdersCount;

    return {
      bucket,
      from: bucketRange(bucket, period).from,
      to: bucketRange(bucket, period).to,
      orders: totals.orders,
      gmv: totals.gmv,
      buyers: totals.buyers,
      sellers: totals.sellers,
      growthPct,
      isCurrent: bucketOf(today, period) === bucket,
    };
  });
}

export const growthMockSource = {
  async getReport(f: ReportFilters, topN: number): Promise<GrowthReport> {
    const orders = filterRange(allOrders(), f.from, f.to);
    const prev = previousRange(f.from, f.to);
    const prevOrders = filterRange(allOrders(), prev.from, prev.to);

    const now = totalsOf(orders);
    const before = totalsOf(prevOrders);

    const kpi = (current: number, previous: number): KpiValue => ({
      value: current,
      delta: deltaOf(current, previous),
    });

    const bySeller = groupBy(
      orders.filter((o) => o.status !== 'CANCELLED'),
      (o) => o.sellerId,
    );
    const prevBySeller = groupBy(
      prevOrders.filter((o) => o.status !== 'CANCELLED'),
      (o) => o.sellerId,
    );

    const topSellers: TopSeller[] = [...bySeller.entries()]
      .map(([sellerId, rows]) => {
        const totals = totalsOf(rows);
        const prevCount = (prevBySeller.get(sellerId) ?? []).filter(
          (o) => o.status !== 'CANCELLED',
        ).length;
        const first = rows[0];
        return {
          sellerId,
          sellerCode: first?.sellerCode ?? '',
          sellerName: first?.sellerName ?? '',
          category: first?.category ?? '',
          orders: totals.orders,
          share: now.orders === 0 ? 0 : totals.orders / now.orders,
          gmv: { amount: totals.gmv, currency: 'VND' as const },
          growthPct: prevCount === 0 ? null : (totals.orders - prevCount) / prevCount,
        };
      })
      .sort((a, b) => b.orders - a.orders)
      .slice(0, topN);

    return {
      period: f.period,
      range: { from: f.from, to: f.to },
      kpis: {
        orders: kpi(now.orders, before.orders),
        buyers: kpi(now.buyers, before.buyers),
        gmv: { ...kpi(now.gmv, before.gmv), money: { amount: now.gmv, currency: 'VND' } },
        sellers: kpi(now.sellers, before.sellers),
      },
      series: buildSeries(f.from, f.to, f.period),
      topSellers,
      totalSellers: now.sellers,
    };
  },
};
