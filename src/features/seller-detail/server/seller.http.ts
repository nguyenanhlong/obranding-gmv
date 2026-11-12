import 'server-only';
import { gatewayFetch, ReportNotFoundError } from '@/platform/reports/http';
import { toApiQuery } from '@/platform/reports/filters';
import { listGrowthOrdersHttp } from '@/platform/reports/orders/http';
import { toOrderPage, type GrowthOrderStatusFilter } from '@/platform/reports/orders/contracts';
import type { SellerSource } from '../contracts';
import { mapSellerSummary } from './seller.mapper';
import { sellerSummarySchema } from './seller.schema';

/** API 7 — seller summary; API 2 — danh sách đơn của nhà bán. */
export const sellerHttpSource: SellerSource = {
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

  async listOrders(sellerId, f, query) {
    const page = await listGrowthOrdersHttp({
      scope: 'SELLER',
      sellerId,
      fromDate: f.from,
      toDate: f.to,
      bucketGroupBy: query.bucketGroupBy,
      bucketPeriodKey: query.bucketPeriodKey,
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      status: query.status as GrowthOrderStatusFilter | undefined,
    });
    return toOrderPage(page);
  },
};
