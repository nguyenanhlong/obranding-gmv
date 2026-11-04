import type { Delta, OrderRow } from '@/contracts/base';

export type Totals = {
  orders: number;
  gmv: number;
  buyers: number;
  sellers: number;
  aov: number;
};

export function totalsOf(orders: readonly OrderRow[]): Totals {
  const counted = orders.filter((o) => o.status !== 'CANCELLED');
  const buyers = new Set(counted.map((o) => o.customerId));
  const sellers = new Set(counted.map((o) => o.sellerId));
  const gmv = counted.reduce((acc, o) => acc + o.total.amount, 0);

  return {
    orders: counted.length,
    gmv,
    buyers: buyers.size,
    sellers: sellers.size,
    aov: counted.length === 0 ? 0 : Math.round(gmv / counted.length),
  };
}

export function deltaOf(current: number, previous: number): Delta {
  const value = current - previous;
  const pct = previous === 0 ? null : value / previous;
  return { value, pct, direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat' };
}

/** Khách mới = khách có đơn đầu tiên (toàn lịch sử) nằm trong khoảng đang xét */
export function newBuyerRate(
  orders: readonly OrderRow[],
  all: readonly OrderRow[],
  from: string,
  to: string,
): number {
  const counted = orders.filter((o) => o.status !== 'CANCELLED');
  if (counted.length === 0) return 0;

  const firstSeen = new Map<string, string>();
  for (const o of all) {
    const date = o.placedAt.slice(0, 10);
    const prev = firstSeen.get(o.customerId);
    if (!prev || date < prev) firstSeen.set(o.customerId, date);
  }

  const buyers = new Set(counted.map((o) => o.customerId));
  let fresh = 0;
  for (const id of buyers) {
    const first = firstSeen.get(id);
    if (first && first >= from && first <= to) fresh += 1;
  }
  return buyers.size === 0 ? 0 : fresh / buyers.size;
}

export function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export function sortedBuckets(map: Map<string, unknown>): string[] {
  return [...map.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function filterRange(
  orders: readonly OrderRow[],
  from: string,
  to: string,
): OrderRow[] {
  return orders.filter((o) => {
    const d = o.placedAt.slice(0, 10);
    return d >= from && d <= to;
  });
}
