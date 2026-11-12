import { z } from 'zod';

/** Response THÔ của API 3 — số dạng chuỗi, % (nếu có) đã ×100. */
const rawBuyer = z.object({
  customerId: z.string(),
  customerName: z.string().nullish().default(null),
  maskedPhone: z.string().nullish().default(null),
  orderCount: z.string(),
  totalValueVnd: z.string(),
  aovVnd: z.string(),
  regionName: z.string().nullish().default(null),
  classification: z.enum(['NEW', 'RETURNING']),
  lastOrderAt: z.string(),
});

export const periodBuyerListSchema = z.object({
  meta: z.object({
    groupBy: z.string(),
    periodKey: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    periodStatus: z.enum(['FINAL', 'PROVISIONAL']),
    timezone: z.string(),
    dataAsOf: z.string(),
    sortBy: z.enum(['ORDER_COUNT', 'TOTAL_VALUE']),
  }),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
  items: z.array(rawBuyer),
});

export type RawPeriodBuyer = z.infer<typeof rawBuyer>;
export type RawPeriodBuyerList = z.infer<typeof periodBuyerListSchema>;
