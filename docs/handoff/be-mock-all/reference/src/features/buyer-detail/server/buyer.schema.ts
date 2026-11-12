import { z } from 'zod';

/** Response THÔ của API 8 (GetBuyerGrowthSummaryResponse). */

const rawBucket = z.object({
  key: z.string(),
  label: z.string(),
  shortLabel: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  orders: z.string(),
  value: z.string(),
});

const rawTopSeller = z.object({
  sellerId: z.string(),
  sellerCode: z.string(),
  sellerName: z.string(),
  orders: z.string(),
  value: z.string(),
});

export const buyerSummarySchema = z.object({
  customer: z.object({
    customerId: z.string(),
    customerName: z.string(),
    phoneMasked: z.string().nullish().default(null),
    province: z.string().nullish().default(null),
    buyerType: z.enum(['NEW', 'RETURNING']),
  }),
  kpis: z.object({
    totalOrders: z.string(),
    validOrders: z.string(),
    cancelledOrders: z.string(),
    totalValue: z.string(),
    aov: z.string(),
    completedOrders: z.string(),
    completionRate: z.number(),
    sellersCount: z.string(),
    firstOrderAt: z.string().nullish().default(null),
    lastOrderAt: z.string().nullish().default(null),
  }),
  series: z.object({
    unit: z.enum(['DAY', 'MONTH', 'QUARTER']),
    buckets: z.array(rawBucket),
  }),
  topSellers: z.array(rawTopSeller).default([]),
});

export type RawBuyerSummary = z.infer<typeof buyerSummarySchema>;
export type RawBuyerBucket = z.infer<typeof rawBucket>;
export type RawBuyerTopSeller = z.infer<typeof rawTopSeller>;
