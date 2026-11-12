import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { bucketOf } from '@/platform/time';
import { mockListGrowthOrders } from '@/platform/reports/orders/mock';
import {
  toOrderPage,
  type GrowthOrderStatusFilter,
} from '@/platform/reports/orders/contracts';
import type {
  PeriodBuyerQuery,
  PeriodOrderQuery,
  PeriodSellerQuery,
  PeriodSource,
} from '../contracts';
import { mockListPeriodBuyers } from '@/platform/reports/period-buyers/mock';
import { mapPeriodBuyerList } from '@/platform/reports/period-buyers/mapper';
import { periodBuyerListSchema } from '@/platform/reports/period-buyers/schema';
import { mockListPeriodSellers } from '@/platform/reports/period-sellers/mock';
import { mapPeriodSellerList } from '@/platform/reports/period-sellers/mapper';
import { periodSellerListSchema } from '@/platform/reports/period-sellers/schema';
import { mapPeriodSummary } from './period.mapper';
import { buildRawPeriodSummary } from './period.raw';
import { periodSummarySchema } from './period.schema';

export const periodMockSource: PeriodSource = {
  async getSummary(f: ReportFilters) {
    return mapPeriodSummary(periodSummarySchema.parse(buildRawPeriodSummary(f)));
  },

  /** Danh sách đơn — dùng chung module API 2, scope PERIOD. */
  async listOrders(f: ReportFilters, query: PeriodOrderQuery) {
    return toOrderPage(
      mockListGrowthOrders({
        scope: 'PERIOD',
        groupBy: f.period.toUpperCase(),
        periodKey: bucketOf(f.from, f.period),
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status as GrowthOrderStatusFilter | undefined,
      }),
    );
  },

  /** API 3 — user mua hàng trong kỳ. */
  async listBuyers(f: ReportFilters, query: PeriodBuyerQuery) {
    const raw = mockListPeriodBuyers({
      groupBy: f.period.toUpperCase(),
      periodKey: bucketOf(f.from, f.period),
      sortBy: query.sortBy ?? 'ORDER_COUNT',
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
    return mapPeriodBuyerList(periodBuyerListSchema.parse(raw));
  },

  /** API 4 — nhà bán trong kỳ. */
  async listSellers(f: ReportFilters, query: PeriodSellerQuery) {
    const raw = mockListPeriodSellers({
      groupBy: f.period.toUpperCase(),
      periodKey: bucketOf(f.from, f.period),
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
    return mapPeriodSellerList(periodSellerListSchema.parse(raw));
  },
};
