import 'server-only';
import { gatewayFetch, type Query } from '@/platform/reports/http';
import type { ListPeriodBuyersParams, PeriodBuyerPage } from './contracts';
import { mapPeriodBuyerList } from './mapper';
import { periodBuyerListSchema } from './schema';

/** API 3 — danh sách user mua hàng theo kỳ */
export async function listPeriodBuyersHttp(p: ListPeriodBuyersParams): Promise<PeriodBuyerPage> {
  const query: Query = {
    groupBy: p.groupBy,
    periodKey: p.periodKey,
    sortBy: p.sortBy ?? 'ORDER_COUNT',
    q: p.q,
    page: p.page,
    pageSize: p.pageSize,
  };

  const raw = await gatewayFetch(
    '/admin/order-reports/growth/buyers',
    periodBuyerListSchema,
    query,
  );
  return mapPeriodBuyerList(raw);
}
