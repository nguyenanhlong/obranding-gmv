import 'server-only';
import { gatewayFetch } from '@/platform/reports/http';
import { listGrowthOrdersHttp } from '@/platform/reports/orders/http';
import { toOrderPage, type GrowthOrderStatusFilter } from '@/platform/reports/orders/contracts';
import { bucketOf } from '@/platform/time';
import { toApiQuery } from '@/platform/reports/filters';
import { listPeriodBuyersHttp } from '@/platform/reports/period-buyers/http';
import { listPeriodSellersHttp } from '@/platform/reports/period-sellers/http';
import type { PeriodSource } from '../contracts';
import { mapPeriodSummary } from './period.mapper';
import { periodSummarySchema } from './period.schema';

/** API 6 — period-summary; API 2 — danh sách đơn của kỳ. */
export const periodHttpSource: PeriodSource = {
  async getSummary(f) {
    const raw = await gatewayFetch(
      '/admin/order-reports/growth/period-summary',
      periodSummarySchema,
      toApiQuery(f),
    );
    return mapPeriodSummary(raw);
  },

  async listOrders(f, query) {
    const page = await listGrowthOrdersHttp({
      scope: 'PERIOD',
      groupBy: f.period.toUpperCase(),
      periodKey: bucketOf(f.from, f.period),
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      status: query.status as GrowthOrderStatusFilter | undefined,
    });
    return toOrderPage(page);
  },

  async listBuyers(f, query) {
    return listPeriodBuyersHttp({
      groupBy: f.period.toUpperCase(),
      periodKey: bucketOf(f.from, f.period),
      sortBy: query.sortBy ?? 'ORDER_COUNT',
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  },

  async listSellers(f, query) {
    return listPeriodSellersHttp({
      groupBy: f.period.toUpperCase(),
      periodKey: bucketOf(f.from, f.period),
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  },
};
