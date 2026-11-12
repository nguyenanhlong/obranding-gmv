import { allOrders, type MockOrder } from '@/platform/mock/dataset';
import { bucketRange, todayIn } from '@/platform/time';
import { PAGE_SIZE_PERIOD_ENTITY } from '@/platform/reports/period-buyers/contracts';
import type { ListPeriodSellersParams } from './contracts';
import type { RawPeriodSellerList } from './schema';

const PERIOD_OF_GROUP: Record<string, 'day' | 'week' | 'month' | 'quarter' | 'year'> = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
};

type Aggregate = {
  sellerId: string;
  latest: MockOrder;
  orderCount: number;
  gmv: number;
  buyers: Set<string>;
  categoryValue: Map<string, number>;
};

function isValidOrder(order: MockOrder): boolean {
  return Boolean(order.sellerId) && order.status !== 'CANCELLED';
}

export function mockListPeriodSellers(p: ListPeriodSellersParams): RawPeriodSellerList {
  const period = PERIOD_OF_GROUP[p.groupBy.toUpperCase()] ?? 'month';
  const range = bucketRange(p.periodKey, period);
  const today = todayIn();

  const inPeriod = allOrders().filter((o) => {
    if (!isValidOrder(o)) return false;
    const day = o.placedAt.slice(0, 10);
    return day >= range.from && day <= range.to;
  });

  const periodGmv = inPeriod.reduce((sum, o) => sum + o.total.amount, 0);

  const map = new Map<string, Aggregate>();
  for (const order of inPeriod) {
    const current = map.get(order.sellerId);
    if (!current) {
      map.set(order.sellerId, {
        sellerId: order.sellerId,
        latest: order,
        orderCount: 1,
        gmv: order.total.amount,
        buyers: new Set([order.customerId]),
        categoryValue: new Map([[order.category, order.total.amount]]),
      });
      continue;
    }
    current.orderCount += 1;
    current.gmv += order.total.amount;
    current.buyers.add(order.customerId);
    current.categoryValue.set(
      order.category,
      (current.categoryValue.get(order.category) ?? 0) + order.total.amount,
    );
    if (
      order.placedAt > current.latest.placedAt ||
      (order.placedAt === current.latest.placedAt && order.id > current.latest.id)
    ) {
      current.latest = order;
    }
  }

  let aggregates = [...map.values()];

  const q = p.q?.trim().toLowerCase() ?? '';
  if (q) {
    aggregates = aggregates.filter(
      (row) =>
        (row.latest.sellerCode ?? '').toLowerCase().startsWith(q) ||
        (row.latest.sellerName ?? '').toLowerCase().includes(q),
    );
  }

  aggregates.sort((a, b) => {
    if (a.gmv !== b.gmv) return b.gmv - a.gmv;
    if (a.orderCount !== b.orderCount) return b.orderCount - a.orderCount;
    return a.sellerId < b.sellerId ? -1 : a.sellerId > b.sellerId ? 1 : 0;
  });

  const page = Math.min(Math.max(1, p.page), 10_000);
  const pageSize = (PAGE_SIZE_PERIOD_ENTITY as readonly number[]).includes(p.pageSize)
    ? p.pageSize
    : 10;
  const totalItems = aggregates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;

  const items = aggregates.slice(start, start + pageSize).map((row) => {
    // danh mục chính: tổng giá trị lớn nhất, hoà thì tên tăng dần (mock không có categoryId)
    const primaryCategory =
      [...row.categoryValue.entries()].sort(
        (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1),
      )[0]?.[0] ?? null;

    return {
      sellerId: row.sellerId,
      sellerCode: row.latest.sellerCode ?? null,
      sellerName: row.latest.sellerName ?? null,
      primaryCategoryName: primaryCategory,
      orderCount: String(row.orderCount),
      gmvVnd: String(row.gmv),
      buyerCount: String(row.buyers.size),
      gmvSharePercent: periodGmv === 0 ? null : Math.round((row.gmv / periodGmv) * 1000) / 10,
    };
  });

  return {
    meta: {
      groupBy: p.groupBy.toUpperCase(),
      periodKey: p.periodKey,
      startDate: range.from,
      endDate: range.to,
      periodStatus: range.to >= today ? 'PROVISIONAL' : 'FINAL',
      timezone: 'Asia/Ho_Chi_Minh',
      dataAsOf: new Date().toISOString(),
    },
    pagination: { page, pageSize, totalItems, totalPages },
    items,
  };
}
