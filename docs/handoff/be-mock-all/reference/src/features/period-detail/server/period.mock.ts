import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { bucketOf } from '@/platform/time';
import { mockListGrowthOrders } from '@/platform/reports/orders/mock';
import {
  toOrderPage,
  type GrowthOrderStatusFilter,
} from '@/platform/reports/orders/contracts';
import type { PeriodOrderQuery, PeriodSource } from '../contracts';
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
};
