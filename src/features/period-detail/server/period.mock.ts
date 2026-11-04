import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import type { OrderRow } from '@/contracts/base';
import { daysBetweenRange, previousRange } from '@/platform/time';
import { deltaOf, filterRange, newBuyerRate, totalsOf } from '@/platform/mock/aggregate';
import { allOrders } from '@/platform/mock/dataset';
import type { DailyBucket, KpiValue, PeriodDetail, PeriodQuery, PeriodSource } from '../contracts';

function kpi(current: number, previous: number): KpiValue {
  return { value: current, delta: deltaOf(current, previous) };
}

function matches(row: OrderRow, q: string | undefined, status: string | undefined): boolean {
  if (status && status !== 'ALL' && row.status !== status) return false;
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    row.publicId.toLowerCase().includes(needle) ||
    row.sellerName.toLowerCase().includes(needle) ||
    row.customerName.toLowerCase().includes(needle)
  );
}

export const periodMockSource: PeriodSource = {
  async getDetail(f: ReportFilters, query: PeriodQuery): Promise<PeriodDetail> {
    const all = allOrders();
    const orders = filterRange(all, f.from, f.to);
    const prev = previousRange(f.from, f.to);
    const prevOrders = filterRange(all, prev.from, prev.to);

    const now = totalsOf(orders);
    const before = totalsOf(prevOrders);

    const daily: DailyBucket[] = daysBetweenRange(f.from, f.to).map((date) => ({
      date,
      orders: orders.filter((o) => o.status !== 'CANCELLED' && o.placedAt.slice(0, 10) === date).length,
    }));

    const peak = daily.reduce<DailyBucket | null>(
      (best, cur) => (!best || cur.orders > best.orders ? cur : best),
      null,
    );

    const filtered = orders
      .filter((o) => matches(o, query.q, query.status))
      .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));

    const start = (query.page - 1) * query.pageSize;

    return {
      range: { from: f.from, to: f.to },
      period: f.period,
      kpis: {
        orders: kpi(now.orders, before.orders),
        gmv: { ...kpi(now.gmv, before.gmv), money: { amount: now.gmv, currency: 'VND' } },
        buyers: kpi(now.buyers, before.buyers),
        sellers: kpi(now.sellers, before.sellers),
        aov: { ...kpi(now.aov, before.aov), money: { amount: now.aov, currency: 'VND' } },
        newBuyerRate: newBuyerRate(orders, all, f.from, f.to),
      },
      daily,
      peak,
      orders: {
        items: filtered.slice(start, start + query.pageSize),
        total: filtered.length,
        page: query.page,
        pageSize: query.pageSize,
      },
    };
  },
};
