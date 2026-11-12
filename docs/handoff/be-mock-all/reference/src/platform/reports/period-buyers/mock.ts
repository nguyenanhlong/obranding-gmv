import { allOrders, customers, type MockOrder } from '@/platform/mock/dataset';
import { bucketRange, todayIn } from '@/platform/time';
import { maskPhone } from '@/platform/format/phone';
import { PAGE_SIZE_PERIOD_ENTITY, type ListPeriodBuyersParams } from './contracts';
import type { RawPeriodBuyerList } from './schema';

const PERIOD_OF_GROUP: Record<string, 'day' | 'week' | 'month' | 'quarter' | 'year'> = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
};

export { maskPhone };

type Aggregate = {
  customerId: string;
  latest: MockOrder;
  orderCount: number;
  totalValue: number;
  lastOrderAt: string;
};

function isValidOrder(order: MockOrder): boolean {
  return Boolean(order.sellerId) && order.status !== 'CANCELLED';
}

function aggregateByCustomer(rows: MockOrder[]): Aggregate[] {
  const map = new Map<string, Aggregate>();
  for (const order of rows) {
    const current = map.get(order.customerId);
    if (!current) {
      map.set(order.customerId, {
        customerId: order.customerId,
        latest: order,
        orderCount: 1,
        totalValue: order.total.amount,
        lastOrderAt: order.placedAt,
      });
      continue;
    }
    current.orderCount += 1;
    current.totalValue += order.total.amount;
    if (order.placedAt > current.lastOrderAt) current.lastOrderAt = order.placedAt;
    if (
      order.placedAt > current.latest.placedAt ||
      (order.placedAt === current.latest.placedAt && order.id > current.latest.id)
    ) {
      current.latest = order;
    }
  }
  return [...map.values()];
}

export function mockListPeriodBuyers(p: ListPeriodBuyersParams): RawPeriodBuyerList {
  const period = PERIOD_OF_GROUP[p.groupBy.toUpperCase()] ?? 'month';
  const range = bucketRange(p.periodKey, period);
  const today = todayIn();

  const inPeriod = allOrders().filter((o) => {
    if (!isValidOrder(o)) return false;
    const day = o.placedAt.slice(0, 10);
    return day >= range.from && day <= range.to;
  });

  // Đơn hợp lệ đầu tiên trên toàn lịch sử → phân loại NEW
  const firstValidDay = new Map<string, string>();
  for (const order of allOrders()) {
    if (!isValidOrder(order)) continue;
    const day = order.placedAt.slice(0, 10);
    const current = firstValidDay.get(order.customerId);
    if (!current || day < current) firstValidDay.set(order.customerId, day);
  }

  const phoneOf = new Map(customers().map((c) => [c.id, c.phone]));
  const sortBy = p.sortBy ?? 'ORDER_COUNT';

  let aggregates = aggregateByCustomer(inPeriod);

  const q = p.q?.trim().toLowerCase() ?? '';
  if (q) {
    const digits = q.replace(/\D/g, '');
    const searchPhone = digits.length >= 4 && digits === q.replace(/\s/g, '');
    aggregates = aggregates.filter((row) => {
      if (row.customerId.toLowerCase().startsWith(q)) return true;
      const name = (row.latest.customerName ?? '').toLowerCase();
      if (name.includes(q)) return true;
      if (searchPhone) {
        const phone = (phoneOf.get(row.customerId) ?? '').replace(/^\+?84/, '0').replace(/\D/g, '');
        if (phone.includes(digits)) return true;
      }
      return false;
    });
  }

  aggregates.sort((a, b) => {
    if (sortBy === 'TOTAL_VALUE') {
      if (a.totalValue !== b.totalValue) return b.totalValue - a.totalValue;
      if (a.orderCount !== b.orderCount) return b.orderCount - a.orderCount;
    } else {
      if (a.orderCount !== b.orderCount) return b.orderCount - a.orderCount;
      if (a.totalValue !== b.totalValue) return b.totalValue - a.totalValue;
    }
    return a.customerId < b.customerId ? -1 : a.customerId > b.customerId ? 1 : 0;
  });

  const page = Math.min(Math.max(1, p.page), 10_000);
  const pageSize = (PAGE_SIZE_PERIOD_ENTITY as readonly number[]).includes(p.pageSize)
    ? p.pageSize
    : 10;
  const totalItems = aggregates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;

  const items = aggregates.slice(start, start + pageSize).map((row) => {
    const firstDay = firstValidDay.get(row.customerId);
    const classification: 'NEW' | 'RETURNING' =
      firstDay !== undefined && firstDay >= range.from && firstDay <= range.to
        ? 'NEW'
        : 'RETURNING';
    return {
      customerId: row.customerId,
      customerName: row.latest.customerName ?? null,
      maskedPhone: maskPhone(phoneOf.get(row.customerId)),
      orderCount: String(row.orderCount),
      totalValueVnd: String(row.totalValue),
      aovVnd: String(Math.round(row.totalValue / row.orderCount)),
      regionName: row.latest.region ?? null,
      classification,
      lastOrderAt: new Date(row.lastOrderAt).toISOString(),
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
      sortBy,
    },
    pagination: { page, pageSize, totalItems, totalPages },
    items,
  };
}
