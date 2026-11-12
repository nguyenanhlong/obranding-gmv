import { z } from 'zod';

/** Response THÔ của API 4 — tiền là chuỗi VND, % đã ×100. */
const rawSeller = z.object({
  sellerId: z.string(),
  sellerCode: z.string().nullish().default(null),
  sellerName: z.string().nullish().default(null),
  primaryCategoryName: z.string().nullish().default(null),
  orderCount: z.string(),
  gmvVnd: z.string(),
  buyerCount: z.string(),
  gmvSharePercent: z.number().nullish().default(null),
});

export const periodSellerListSchema = z.object({
  meta: z.object({
    groupBy: z.string(),
    periodKey: z.string(),
    startDate: z.string(),
    endDate: z.string(),
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
  items: z.array(rawSeller),
});

export type RawPeriodSeller = z.infer<typeof rawSeller>;
export type RawPeriodSellerList = z.infer<typeof periodSellerListSchema>;
