import 'server-only';
import { bucketOf } from '@/platform/time';
import { filterRange, groupBy, totalsOf } from '@/platform/mock/aggregate';
import { allOrders } from '@/platform/mock/dataset';
import type { SellerDetail, SellerSource } from '../contracts';

export const sellerMockSource: SellerSource = {
  async getDetail(sellerId, f, page, pageSize): Promise<SellerDetail | null> {
    const all = allOrders();
    const mine = all.filter((o) => o.sellerId === sellerId);
    if (mine.length === 0) return null;

    const orders = filterRange(mine, f.from, f.to);
    const counted = orders.filter((o) => o.status !== 'CANCELLED');
    const totals = totalsOf(orders);
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;

    const monthlyMap = groupBy(counted, (o) => bucketOf(o.placedAt.slice(0, 10), 'month'));
    const monthly = [...monthlyMap.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([bucket, rows]) => {
        const t = totalsOf(rows);
        return { bucket, orders: t.orders, gmv: t.gmv, buyers: t.buyers };
      });

    const sorted = [...orders].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
    const start = (page - 1) * pageSize;
    const first = mine[0];

    return {
      seller: {
        id: sellerId,
        code: first?.sellerCode ?? '',
        name: first?.sellerName ?? '',
        category: first?.category ?? '',
      },
      range: { from: f.from, to: f.to },
      period: f.period,
      kpis: {
        orders: totals.orders,
        gmv: { amount: totals.gmv, currency: 'VND' },
        buyers: totals.buyers,
        aov: { amount: totals.aov, currency: 'VND' },
        completionRate: orders.length === 0 ? 0 : completed / orders.length,
        ordersPerUser: totals.buyers === 0 ? 0 : totals.orders / totals.buyers,
      },
      monthly,
      orders: {
        items: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page,
        pageSize,
      },
    };
  },
};
