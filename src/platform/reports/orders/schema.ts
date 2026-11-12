import { z } from 'zod';

/** Response THÔ của API 2 — số tiền là chuỗi VND, timestamp ISO UTC. */

const rawItem = z.object({
  orderPublicId: z.string(),
  orderNumber: z.string(),
  placedAt: z.string(),
  sellerId: z.string().nullish().default(null),
  sellerCode: z.string().nullish().default(null),
  sellerName: z.string().nullish().default(null),
  customerId: z.string().nullish().default(null),
  customerName: z.string().nullish().default(null),
  primaryCategoryName: z.string().nullish().default(null),
  itemQuantity: z.number().default(0),
  regionName: z.string().nullish().default(null),
  orderTotalVnd: z.string(),
  discountBadges: z.array(
    z.enum(['SANH', 'PRODUCT_DISCOUNT', 'SELLER_VOUCHER', 'PLATFORM_VOUCHER', 'SHIPPING_SUPPORT']),
  ).default([]),
  paymentMethod: z.enum(['COD', 'NO_CASH', 'REFUND']).nullish().default(null),
  paymentStatus: z.enum(['waiting', 'success', 'failed']).nullish().default(null),
  status: z.enum([
    'PENDING_PROCESSING',
    'PREPARING_SHIPMENT',
    'COMPLETED',
    'CANCELLED',
    'NEEDS_RESOLUTION',
  ]),
  sourceStatus: z.string(),
  state: z.string().nullish().default(null),
});

export const orderListSchema = z.object({
  meta: z.object({
    scope: z.enum(['PERIOD', 'CUSTOMER', 'SELLER']),
    groupBy: z.string().nullish().default(null),
    periodKey: z.string().nullish().default(null),
    customerId: z.string().nullish().default(null),
    sellerId: z.string().nullish().default(null),
    startDate: z.string(),
    endDate: z.string(),
    listStartDate: z.string(),
    listEndDate: z.string(),
    bucketGroupBy: z.string().nullish().default(null),
    bucketPeriodKey: z.string().nullish().default(null),
    periodStatus: z.enum(['FINAL', 'PROVISIONAL']),
    timezone: z.string(),
    dataAsOf: z.string(),
  }),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
  items: z.array(rawItem),
});

export type RawOrderList = z.infer<typeof orderListSchema>;
export type RawOrderItem = z.infer<typeof rawItem>;
