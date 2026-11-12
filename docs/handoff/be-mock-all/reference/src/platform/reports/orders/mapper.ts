import { parseIntString } from '@/platform/reports/parse';
import type { GrowthOrderPage, GrowthOrderRow } from './contracts';
import type { RawOrderItem, RawOrderList } from './schema';

export function mapOrderItem(raw: RawOrderItem): GrowthOrderRow {
  return {
    orderPublicId: raw.orderPublicId,
    orderNumber: raw.orderNumber,
    placedAt: raw.placedAt,
    sellerId: raw.sellerId ?? null,
    sellerCode: raw.sellerCode ?? null,
    sellerName: raw.sellerName ?? null,
    customerId: raw.customerId ?? null,
    customerName: raw.customerName ?? null,
    primaryCategoryName: raw.primaryCategoryName ?? null,
    itemQuantity: raw.itemQuantity,
    regionName: raw.regionName ?? null,
    orderTotalVnd: parseIntString(raw.orderTotalVnd),
    discountBadges: raw.discountBadges,
    paymentMethod: raw.paymentMethod ?? null,
    paymentStatus: raw.paymentStatus ?? null,
    status: raw.status,
    sourceStatus: raw.sourceStatus,
    state: raw.state ?? null,
  };
}

export function mapOrderList(raw: RawOrderList): GrowthOrderPage {
  return {
    meta: {
      scope: raw.meta.scope,
      groupBy: raw.meta.groupBy ?? null,
      periodKey: raw.meta.periodKey ?? null,
      customerId: raw.meta.customerId ?? null,
      sellerId: raw.meta.sellerId ?? null,
      startDate: raw.meta.startDate,
      endDate: raw.meta.endDate,
      listStartDate: raw.meta.listStartDate,
      listEndDate: raw.meta.listEndDate,
      bucketGroupBy: raw.meta.bucketGroupBy ?? null,
      bucketPeriodKey: raw.meta.bucketPeriodKey ?? null,
      periodStatus: raw.meta.periodStatus,
      timezone: raw.meta.timezone,
      dataAsOf: raw.meta.dataAsOf,
    },
    pagination: raw.pagination,
    items: raw.items.map(mapOrderItem),
  };
}
