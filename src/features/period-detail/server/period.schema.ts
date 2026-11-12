import { z } from 'zod';

/** Response THÔ của API 6 (GetGrowthPeriodSummaryResponse): số là chuỗi, % ×100. */

const rawMetric = z.object({
  value: z.string(),
  previousValue: z.string().nullish().default(null),
  growthPercent: z.number().nullish().default(null),
});

const rawBucket = z.object({
  key: z.string(),
  label: z.string(),
  shortLabel: z.string(),
  orders: z.string(),
  isFuture: z.boolean().default(false),
});

export const periodSummarySchema = z.object({
  period: z.object({
    periodKey: z.string(),
    periodLabel: z.string(),
    groupBy: z.enum(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR']),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['FINAL', 'PROVISIONAL']),
  }),
  kpis: z.object({
    orders: rawMetric,
    gmv: rawMetric,
    buyers: rawMetric,
    activeSellers: rawMetric,
    aov: z.string(),
    newBuyers: z.string(),
    newBuyerRate: z.number(),
  }),
  distribution: z.object({
    unit: z.enum(['HOUR', 'WEEKDAY', 'DAY', 'WEEK', 'MONTH']),
    buckets: z.array(rawBucket),
    peak: rawBucket.nullish().default(null),
  }),
});

export type RawPeriodSummary = z.infer<typeof periodSummarySchema>;
export type RawBucket = z.infer<typeof rawBucket>;
