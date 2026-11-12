import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { mockListGrowthOrders } from '@/platform/reports/orders/mock';
import { unitForRange } from '@/platform/reports/series';
import { toOrderPage, type GrowthOrderStatusFilter } from '@/platform/reports/orders/contracts';
import type { SellerOrderQuery, SellerSource } from '../contracts';
import { mapSellerSummary } from './seller.mapper';
import { buildRawSellerSummary } from './seller.raw';
import { sellerSummarySchema } from './seller.schema';

export const sellerMockSource: SellerSource = {
  async getSummary(sellerId: string, f: ReportFilters) {
    const raw = buildRawSellerSummary(sellerId, f.from, f.to);
    return raw ? mapSellerSummary(sellerSummarySchema.parse(raw)) : null;
  },

  /** Danh sách đơn của nhà bán — scope SELLER của API 2. */
  async listOrders(sellerId, f, query: SellerOrderQuery) {
    return toOrderPage(
      mockListGrowthOrders({
        scope: 'SELLER',
        sellerId,
        fromDate: f.from,
        toDate: f.to,
        bucketGroupBy: query.bucket ? unitForRange(f.from, f.to) : undefined,
        bucketPeriodKey: query.bucket,
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status as GrowthOrderStatusFilter | undefined,
      }),
    );
  },
};
