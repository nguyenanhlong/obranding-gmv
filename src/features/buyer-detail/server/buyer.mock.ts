import 'server-only';
import { bucketOf, previousRange } from '@/platform/time';
import { deltaOf, filterRange, groupBy, totalsOf } from '@/platform/mock/aggregate';
import { allOrders } from '@/platform/mock/dataset';
import type { BuyerDetail, BuyerSource } from '../contracts';

export const buyerMockSource: BuyerSource = {
  async getDetail(customerId, f, page, pageSize): Promise<BuyerDetail | null> {
    const all = allOrders();
    const mine = all.filter((o) => o.customerId === customerId);
    if (mine.length === 0) return null;

    const orders = filterRange(mine, f.from, f.to);
    const counted = orders.filter((o) => o.status !== 'CANCELLED');
    const totals = totalsOf(orders);

    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const sellers = new Set(counted.map((o) => o.sellerId));

    const prev = previousRange(f.from, f.to);
    const prevTotals = totalsOf(filterRange(mine, prev.from, prev.to));

    const monthlyMap = groupBy(counted, (o) => bucketOf(o.placedAt.slice(0, 10), 'month'));
    const monthly = [...monthlyMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([bucket, rows]) => ({
        bucket,
        amount: rows.reduce((acc, o) => acc + o.total.amount, 0),
        orders: rows.length,
      }));

    const sellerMap = groupBy(counted, (o) => o.sellerId);
    const topSellers = [...sellerMap.entries()]
      .map(([sellerId, rows]) => ({
        sellerId,
        sellerName: rows[0]?.sellerName ?? '',
        orders: rows.length,
        gmv: { amount: rows.reduce((acc, o) => acc + o.total.amount, 0), currency: 'VND' as const },
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    const sorted = [...orders].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
    const start = (page - 1) * pageSize;
    const first = mine.reduce(
      (min, o) => (o.placedAt < min ? o.placedAt : min),
      mine[0]?.placedAt ?? '',
    );

    return {
      customer: {
        id: customerId,
        name: mine[0]?.customerName ?? '',
        phone: '090****818',
        region: mine[0]?.region ?? '',
      },
      range: { from: f.from, to: f.to },
      period: f.period,
      kpis: {
        orders: orders.length,
        totalValue: { amount: totals.gmv, currency: 'VND' },
        aov: { amount: totals.aov, currency: 'VND' },
        completionRate: orders.length === 0 ? 0 : completed / orders.length,
        sellerCount: sellers.size,
        lastOrderAt: sorted[0]?.placedAt ?? null,
        firstOrderAt: first || null,
      },
      monthly,
      topSellers,
      orders: {
        items: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page,
        pageSize,
      },
      totalValueDelta: deltaOf(totals.gmv, prevTotals.gmv),
    };
  },
};
