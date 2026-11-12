import { allOrders } from '@/platform/mock/dataset';
import { buildSeriesBuckets, unitForRange } from '@/platform/reports/series';
import type { RawBuyerSummary } from './buyer.schema';

function maskPhone(customerId: string): string {
  const digits = customerId.replace(/\D/g, '').padStart(8, '0');
  return `090${'*'.repeat(4)}${digits.slice(-3)}`;
}

/** Dựng response THÔ của API 8. Trả null khi khách chưa có đơn nào trên hệ thống. */
export function buildRawBuyerSummary(
  customerId: string,
  from: string,
  to: string,
): RawBuyerSummary | null {
  const all = allOrders().filter((o) => o.customerId === customerId);
  if (all.length === 0) return null;

  const latest = [...all].sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1))[0];

  const inRange = all.filter((o) => {
    const day = o.placedAt.slice(0, 10);
    return day >= from && day <= to;
  });
  const valid = inRange.filter((o) => o.status !== 'CANCELLED');

  const totalValue = valid.reduce((acc, o) => acc + o.total.amount, 0);
  const cancelled = inRange.filter((o) => o.status === 'CANCELLED').length;
  const completed = inRange.filter((o) => o.status === 'COMPLETED').length;
  const sellers = new Set(valid.map((o) => o.sellerId)).size;

  const sortedDates = inRange.map((o) => o.placedAt).sort();
  const firstOrderAt = sortedDates[0] ?? null;
  const lastOrderAt = sortedDates[sortedDates.length - 1] ?? null;

  // NEW: không có đơn hợp lệ nào trước fromDate, nhưng có đơn hợp lệ trong kỳ
  const hadBefore = all.some((o) => {
    const day = o.placedAt.slice(0, 10);
    return o.status !== 'CANCELLED' && day < from;
  });
  const buyerType = !hadBefore && valid.length > 0 ? 'NEW' : 'RETURNING';

  const unit = unitForRange(from, to);
  const buckets = buildSeriesBuckets(from, to, unit).map((bucket) => {
    const rows = valid.filter((o) => {
      const day = o.placedAt.slice(0, 10);
      return day >= bucket.startDate && day <= bucket.endDate;
    });
    return {
      key: bucket.key,
      label: bucket.label,
      shortLabel: bucket.shortLabel,
      startDate: bucket.startDate,
      endDate: bucket.endDate,
      orders: String(rows.length),
      value: String(rows.reduce((acc, o) => acc + o.total.amount, 0)),
    };
  });

  const bySeller = new Map<string, { orders: number; value: number; row: (typeof valid)[number] }>();
  for (const o of valid) {
    const entry = bySeller.get(o.sellerId);
    if (entry) {
      entry.orders += 1;
      entry.value += o.total.amount;
    } else {
      bySeller.set(o.sellerId, { orders: 1, value: o.total.amount, row: o });
    }
  }

  const topSellers = [...bySeller.entries()]
    .sort((a, b) => b[1].value - a[1].value || b[1].orders - a[1].orders || (a[0] < b[0] ? -1 : 1))
    .slice(0, 5)
    .map(([sellerId, entry]) => ({
      sellerId,
      sellerCode: entry.row.sellerCode,
      sellerName: entry.row.sellerName,
      orders: String(entry.orders),
      value: String(entry.value),
    }));

  return {
    customer: {
      customerId,
      customerName: latest?.customerName ?? '',
      phoneMasked: maskPhone(customerId),
      province: latest?.region ?? null,
      buyerType,
    },
    kpis: {
      totalOrders: String(inRange.length),
      validOrders: String(valid.length),
      cancelledOrders: String(cancelled),
      totalValue: String(totalValue),
      aov: valid.length === 0 ? '0' : String(Math.round(totalValue / valid.length)),
      completedOrders: String(completed),
      completionRate:
        inRange.length === 0 ? 0 : Math.round((completed / inRange.length) * 1000) / 10,
      sellersCount: String(sellers),
      firstOrderAt,
      lastOrderAt,
    },
    series: { unit, buckets },
    topSellers,
  };
}
