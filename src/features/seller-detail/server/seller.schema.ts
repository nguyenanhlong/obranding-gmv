import { z } from 'zod';

/** Response THÔ của API 7 (GetSellerGrowthSummaryResponse): số là chuỗi, % ×100. */

const rawBucket = z.object({
  key: z.string(),
  label: z.string(),
  shortLabel: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  orders: z.string(),
  gmv: z.string(),
  buyers: z.string(),
});

export const sellerSummarySchema = z.object({
  seller: z.object({
    sellerId: z.string(),
    sellerCode: z.string(),
    sellerName: z.string(),
    mainCategory: z.string().nullish().default(null),
  }),
  kpis: z.object({
    orders: z.string(),
    gmv: z.string(),
    buyers: z.string(),
    aov: z.string(),
    completedOrders: z.string(),
    completionRate: z.number(),
    ordersPerBuyer: z.number(),
  }),
  series: z.object({
    unit: z.enum(['DAY', 'MONTH', 'QUARTER']),
    buckets: z.array(rawBucket),
  }),
});

export type RawSellerSummary = z.infer<typeof sellerSummarySchema>;
export type RawSellerBucket = z.infer<typeof rawBucket>;
