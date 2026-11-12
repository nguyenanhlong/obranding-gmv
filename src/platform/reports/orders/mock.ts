import { allOrders, customers, type MockOrder } from '@/platform/mock/dataset';
import { bucketRange, todayIn } from '@/platform/time';
import type {
  DiscountBadgeKind,
  GrowthOrderPage,
  GrowthOrderStatus,
  ListGrowthOrdersParams,
  PaymentMethod,
} from './contracts';
import { PAGE_SIZE_ORDER } from './contracts';
import { mapOrderList } from './mapper';
import { orderListSchema, type RawOrderItem, type RawOrderList } from './schema';

const BADGE_BY_LABEL: Record<string, DiscountBadgeKind> = {
  'Thẻ Sành': 'SANH',
  'Giảm giá SP': 'PRODUCT_DISCOUNT',
  'Voucher shop': 'SELLER_VOUCHER',
  'Voucher sàn': 'PLATFORM_VOUCHER',
  'Hỗ trợ ship': 'SHIPPING_SUPPORT',
};

const BADGE_ORDER: DiscountBadgeKind[] = [
  'SANH',
  'PRODUCT_DISCOUNT',
  'SELLER_VOUCHER',
  'PLATFORM_VOUCHER',
  'SHIPPING_SUPPORT',
];

const STATUS_MAP: Record<string, GrowthOrderStatus> = {
  PENDING: 'PENDING_PROCESSING',
  PREPARING: 'PREPARING_SHIPMENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NEEDS_RESOLUTION: 'NEEDS_RESOLUTION',
};

const PERIOD_OF_GROUP: Record<string, 'day' | 'week' | 'month' | 'quarter' | 'year'> = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
};

function toUtcIso(placedAt: string): string {
  const d = new Date(placedAt);
  return Number.isNaN(d.getTime()) ? placedAt : d.toISOString();
}

function badgesOf(order: MockOrder): DiscountBadgeKind[] {
  const set = new Set<DiscountBadgeKind>();
  for (const d of order.discounts) {
    const kind = BADGE_BY_LABEL[d.label];
    if (kind) set.add(kind);
  }
  return BADGE_ORDER.filter((b) => set.has(b));
}

function paymentOf(order: MockOrder): {
  method: PaymentMethod;
  status: 'waiting' | 'success' | 'failed';
} {
  const method: PaymentMethod = order.payment === 'COD' ? 'COD' : 'NO_CASH';
  return {
    method,
    status:
      order.status === 'CANCELLED'
        ? 'failed'
        : order.status === 'COMPLETED'
          ? 'success'
          : 'waiting',
  };
}

/** Response THÔ — tiền là chuỗi VND, giống hệt BE trả về. */
function toRawRow(order: MockOrder): RawOrderItem {
  const pay = paymentOf(order);
  return {
    orderPublicId: order.publicId,
    orderNumber: `OD-${order.publicId.slice(0, 10)}`,
    placedAt: toUtcIso(order.placedAt),
    sellerId: order.sellerId,
    sellerCode: order.sellerCode,
    sellerName: order.sellerName,
    customerId: order.customerId,
    customerName: order.customerName,
    primaryCategoryName: order.category,
    itemQuantity: order.itemCount,
    regionName: order.region,
    orderTotalVnd: String(order.total.amount),
    discountBadges: badgesOf(order),
    paymentMethod: pay.method,
    paymentStatus: pay.status,
    status: STATUS_MAP[order.status] ?? 'COMPLETED',
    sourceStatus: order.status,
    state: order.status,
  };
}

function resolveRange(p: ListGrowthOrdersParams): { from: string; to: string } | null {
  if (p.scope === 'PERIOD') {
    if (!p.groupBy || !p.periodKey) return null;
    const period = PERIOD_OF_GROUP[p.groupBy.toUpperCase()];
    if (!period) return null;
    return bucketRange(p.periodKey, period);
  }

  if (!p.fromDate || !p.toDate) return null;
  let from = p.fromDate;
  let to = p.toDate;

  if (p.scope === 'SELLER' && p.bucketGroupBy && p.bucketPeriodKey) {
    const period = PERIOD_OF_GROUP[p.bucketGroupBy.toUpperCase()];
    if (period) {
      const bucket = bucketRange(p.bucketPeriodKey, period);
      from = bucket.from > from ? bucket.from : from;
      to = bucket.to < to ? bucket.to : to;
    }
  }
  return { from, to };
}

const CUSTOMER_PHONE = new Map(
  customers().map((c) => [
    c.id,
    c.phone.replace(/^\+?84/, '0').replace(/\D/g, ''),
  ]),
);

function matchesQuery(row: RawOrderItem, p: ListGrowthOrdersParams, q: string): boolean {
  const haystack =
    p.scope === 'PERIOD'
      ? [
          row.orderPublicId,
          row.orderNumber,
          row.customerName ?? '',
          row.customerId ?? '',
          row.sellerName ?? '',
          row.sellerCode ?? '',
        ]
      : p.scope === 'CUSTOMER'
        ? [row.orderPublicId, row.orderNumber, row.sellerName ?? '', row.sellerCode ?? '']
        : [
            row.orderPublicId,
            row.orderNumber,
            row.customerName ?? '',
            row.customerId ?? '',
          ];

  if (haystack.some((v) => v.toLowerCase().includes(q))) return true;

  // SELLER: q toàn số, đủ 4 số trở lên thì tìm thêm theo SĐT đã chuẩn hoá.
  if (p.scope === 'SELLER') {
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 4 && digits === q) {
      const phone = row.customerId ? CUSTOMER_PHONE.get(row.customerId) : undefined;
      return Boolean(phone?.includes(digits));
    }
  }
  return false;
}

/** Dựng response THÔ của API 2 — dùng chung cho mock và sample bàn giao. */
export function buildRawOrderList(p: ListGrowthOrdersParams): RawOrderList {
  const range = resolveRange(p);
  const today = todayIn();
  const startDate = range?.from ?? p.fromDate ?? today;
  const endDate = range?.to ?? p.toDate ?? today;

  let rows = allOrders()
    .filter((o) => {
      const day = o.placedAt.slice(0, 10);
      if (day < startDate || day > endDate) return false;
      if (p.scope === 'CUSTOMER' && o.customerId !== p.customerId) return false;
      if (p.scope === 'SELLER' && o.sellerId !== p.sellerId) return false;
      return true;
    })
    .map(toRawRow);

  if (p.status && p.status !== 'ALL') {
    rows = rows.filter((r) => r.status === p.status);
  }

  const q = p.q?.trim().toLowerCase();
  if (q) rows = rows.filter((r) => matchesQuery(r, p, q));

  rows.sort((a, b) => {
    if (a.placedAt !== b.placedAt) return a.placedAt < b.placedAt ? 1 : -1;
    return a.orderPublicId < b.orderPublicId ? 1 : -1;
  });

  const page = Math.min(Math.max(1, p.page), 10_000);
  const pageSize = (PAGE_SIZE_ORDER as readonly number[]).includes(p.pageSize) ? p.pageSize : 10;
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;

  return {
    meta: {
      scope: p.scope,
      groupBy: p.scope === 'PERIOD' ? (p.groupBy?.toUpperCase() ?? null) : null,
      periodKey: p.scope === 'PERIOD' ? (p.periodKey ?? null) : null,
      customerId: p.scope === 'CUSTOMER' ? (p.customerId ?? null) : null,
      sellerId: p.scope === 'SELLER' ? (p.sellerId ?? null) : null,
      startDate,
      endDate,
      listStartDate: startDate,
      listEndDate: endDate,
      bucketGroupBy: p.scope === 'SELLER' ? (p.bucketGroupBy?.toUpperCase() ?? null) : null,
      bucketPeriodKey: p.scope === 'SELLER' ? (p.bucketPeriodKey ?? null) : null,
      periodStatus: endDate >= today ? 'PROVISIONAL' : 'FINAL',
      timezone: 'Asia/Ho_Chi_Minh',
      dataAsOf: new Date().toISOString(),
    },
    pagination: { page, pageSize, totalItems, totalPages },
    items: rows.slice(start, start + pageSize),
  };
}

/** Mock đi qua zod rồi mới map — cùng đường với http (N13). */
export function mockListGrowthOrders(p: ListGrowthOrdersParams): GrowthOrderPage {
  return mapOrderList(orderListSchema.parse(buildRawOrderList(p)));
}
