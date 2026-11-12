import 'server-only';
import { gatewayFetch, type Query } from '@/platform/reports/http';
import type { ListPeriodSellersParams, PeriodSellerPage } from './contracts';
import { mapPeriodSellerList } from './mapper';
import { periodSellerListSchema } from './schema';

/** API 4 — danh sách nhà bán theo kỳ */
export async function listPeriodSellersHttp(p: ListPeriodSellersParams): Promise<PeriodSellerPage> {
  const query: Query = {
    groupBy: p.groupBy,
    periodKey: p.periodKey,
    q: p.q,
    page: p.page,
    pageSize: p.pageSize,
  };

  const raw = await gatewayFetch(
    '/admin/order-reports/growth/sellers',
    periodSellerListSchema,
    query,
  );
  return mapPeriodSellerList(raw);
}
