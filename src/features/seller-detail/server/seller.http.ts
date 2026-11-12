import 'server-only';
import { gatewayFetch, ReportNotFoundError } from '@/platform/reports/http';
import { toApiQuery } from '@/platform/reports/filters';
import type { SellerSource } from '../contracts';
import { mapSellerSummary } from './seller.mapper';
import { sellerSummarySchema } from './seller.schema';

/** API 7 — seller summary. listOrders chưa có (API 2), source.ts nối mock. */
export const sellerHttpSource: Pick<SellerSource, 'getSummary'> = {
  async getSummary(sellerId, f) {
    try {
      const raw = await gatewayFetch(
        `/admin/order-reports/growth/sellers/${encodeURIComponent(sellerId)}/summary`,
        sellerSummarySchema,
        toApiQuery(f),
      );
      return mapSellerSummary(raw);
    } catch (error) {
      if (error instanceof ReportNotFoundError) return null;
      throw error;
    }
  },
};
