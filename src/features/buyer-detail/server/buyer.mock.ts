import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { mockListGrowthOrders } from '@/platform/reports/orders/mock';
import { toOrderPage, type GrowthOrderStatusFilter } from '@/platform/reports/orders/contracts';
import type { BuyerOrderQuery, BuyerSource } from '../contracts';
import { mapBuyerSummary } from './buyer.mapper';
import { buildRawBuyerSummary } from './buyer.raw';
import { buyerSummarySchema } from './buyer.schema';

export const buyerMockSource: BuyerSource = {
  async getSummary(customerId: string, f: ReportFilters) {
    const raw = buildRawBuyerSummary(customerId, f.from, f.to);
    return raw ? mapBuyerSummary(buyerSummarySchema.parse(raw)) : null;
  },

  /** Danh sách đơn của khách — scope CUSTOMER của API 2. */
  async listOrders(customerId, f, query: BuyerOrderQuery) {
    return toOrderPage(
      mockListGrowthOrders({
        scope: 'CUSTOMER',
        customerId,
        fromDate: query.from ?? f.from,
        toDate: query.to ?? f.to,
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status as GrowthOrderStatusFilter | undefined,
      }),
    );
  },
};
