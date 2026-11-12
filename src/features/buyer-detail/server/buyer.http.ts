import 'server-only';
import { gatewayFetch, ReportNotFoundError } from '@/platform/reports/http';
import { toApiQuery } from '@/platform/reports/filters';
import { listGrowthOrdersHttp } from '@/platform/reports/orders/http';
import { toOrderPage, type GrowthOrderStatusFilter } from '@/platform/reports/orders/contracts';
import type { BuyerSource } from '../contracts';
import { mapBuyerSummary } from './buyer.mapper';
import { buyerSummarySchema } from './buyer.schema';

/** API 8 — buyer summary; API 2 — danh sách đơn của khách. */
export const buyerHttpSource: BuyerSource = {
  async getSummary(customerId, f) {
    try {
      const raw = await gatewayFetch(
        `/admin/order-reports/growth/buyers/${encodeURIComponent(customerId)}/summary`,
        buyerSummarySchema,
        toApiQuery(f),
      );
      return mapBuyerSummary(raw);
    } catch (error) {
      if (error instanceof ReportNotFoundError) return null;
      throw error;
    }
  },

  async listOrders(customerId, f, query) {
    const page = await listGrowthOrdersHttp({
      scope: 'CUSTOMER',
      customerId,
      fromDate: f.from,
      toDate: f.to,
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      status: query.status as GrowthOrderStatusFilter | undefined,
    });
    return toOrderPage(page);
  },
};
