import { allOrders } from '@/platform/mock/dataset';
import { buildSeriesBuckets, unitForRange } from '@/platform/reports/series';
import type { RawSellerSummary } from './seller.schema';

/** Dựng response THÔ của API 7 từ dataset mock. Trả null khi nhà bán chưa có đơn nào. */
export function buildRawSellerSummary(sellerId: string, from: string, to: string): RawSellerSummary | null {
  const all = allOrders().filter((o) => o.sellerId === sellerId);
  if (all.length === 0) return null;

  const latest = [...all].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1))[0];
  const rows = all.filter((o) => {
    const day = o.placedAt.slice(0, 10);
    return day >= from && day <= to && o.status !== 'CANCELLED';
  });

  const gmv = rows.reduce((acc, o) => acc + o.total.amount, 0);
  const buyers = new Set(rows.map((o) => o.customerId)).size;
  const completed = rows.filter((o) => o.status === 'COMPLETED').length;

  // danh mục chính: xuất hiện nhiều đơn nhất, hoà thì theo alphabet
  const categoryCount = new Map<string, number>();
  for (const o of rows) categoryCount.set(o.category, (categoryCount.get(o.category) ?? 0) + 1);
  const mainCategory =
    [...categoryCount.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? null;

  const unit = unitForRange(from, to);
  const buckets = buildSeriesBuckets(from, to, unit).map((bucket) => {
    const inBucket = rows.filter((o) => {
      const day = o.placedAt.slice(0, 10);
      return day >= bucket.startDate && day <= bucket.endDate;
    });
    return {
      key: bucket.key,
      label: bucket.label,
      shortLabel: bucket.shortLabel,
      startDate: bucket.startDate,
      endDate: bucket.endDate,
      orders: String(inBucket.length),
      gmv: String(inBucket.reduce((acc, o) => acc + o.total.amount, 0)),
      buyers: String(new Set(inBucket.map((o) => o.customerId)).size),
    };
  });

  return {
    seller: {
      sellerId,
      sellerCode: latest?.sellerCode ?? '',
      sellerName: latest?.sellerName ?? '',
      mainCategory,
    },
    kpis: {
      orders: String(rows.length),
      gmv: String(gmv),
      buyers: String(buyers),
      aov: rows.length === 0 ? '0' : String(Math.round(gmv / rows.length)),
      completedOrders: String(completed),
      completionRate: rows.length === 0 ? 0 : Math.round((completed / rows.length) * 1000) / 10,
      ordersPerBuyer: buyers === 0 ? 0 : Math.round((rows.length / buyers) * 100) / 100,
    },
    series: { unit, buckets },
  };
}
