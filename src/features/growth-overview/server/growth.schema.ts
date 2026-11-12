import { z } from 'zod';

/**
 * Schema cho response THÔ của API 1 (GetGrowthReportResponse).
 * Mọi số là chuỗi, % đã nhân 100 — mapper chịu trách nhiệm chuẩn hoá.
 */

const rawMetric = z.object({
  value: z.string(),
  previousValue: z.string().nullish().default(null),
  growthPercent: z.number().nullish().default(null),
});

const rawBuyer = z.object({
  customerId: z.string(),
  customerName: z.string(),
  orders: z.string(),
  value: z.string(),
});

const rawSeller = z.object({
  sellerId: z.string(),
  sellerCode: z.string(),
  sellerName: z.string(),
  category: z.string(),
  orders: z.string(),
  gmv: z.string(),
  orderShare: z.number(),
  growthPercent: z.number().nullish().default(null),
});

const rawPeriod = z.object({
  periodKey: z.string(),
  periodLabel: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['FINAL', 'PROVISIONAL']),
  orders: rawMetric,
  buyers: rawMetric,
  gmv: rawMetric,
  activeSellers: rawMetric,
  aov: z.string(),
  topBuyersByOrders: z.array(rawBuyer).default([]),
  topBuyersByValue: z.array(rawBuyer).default([]),
  topSellersByOrders: z.array(rawSeller).default([]),
});

export const growthResponseSchema = z.object({
  meta: z.object({
    startDate: z.string(),
    endDate: z.string(),
    groupBy: z.enum(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR']),
    totalPeriods: z.number(),
  }),
  periods: z.array(rawPeriod),
});

export type RawGrowthResponse = z.infer<typeof growthResponseSchema>;
export type RawGrowthPeriod = z.infer<typeof rawPeriod>;
