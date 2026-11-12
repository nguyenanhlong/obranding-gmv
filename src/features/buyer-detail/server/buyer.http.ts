import 'server-only';
import { gatewayFetch } from '@/platform/reports/http';
import { toApiQuery } from '@/platform/reports/filters';
import type { BuyerSource } from '../contracts';
import { mapBuyerSummary } from './buyer.mapper';
import { buyerSummarySchema } from './buyer.schema';

/** API 8 — buyer summary. listOrders chưa có (API 2), source.ts nối mock. */
export const buyerHttpSource: Pick<BuyerSource, 'getSummary'> = {
  async getSummary(customerId, f) {
    const raw = await gatewayFetch(
      `/admin/order-reports/growth/buyers/${customerId}/summary`,
      buyerSummarySchema,
      toApiQuery(f),
    );
    return mapBuyerSummary(raw);
  },
};
