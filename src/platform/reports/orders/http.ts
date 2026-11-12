import 'server-only';
import { gatewayFetch } from '@/platform/reports/http';
import type { Query } from '@/platform/reports/http';
import type { GrowthOrderPage, ListGrowthOrdersParams } from './contracts';
import { mapOrderList } from './mapper';
import { orderListSchema } from './schema';

/** API 2 — một endpoint cho 3 scope. */
export async function listGrowthOrdersHttp(p: ListGrowthOrdersParams): Promise<GrowthOrderPage> {
  const query: Query = {
    scope: p.scope,
    page: p.page,
    pageSize: p.pageSize,
    q: p.q,
    status: p.status,
  };

  if (p.scope === 'PERIOD') {
    query.groupBy = p.groupBy;
    query.periodKey = p.periodKey;
  } else {
    query.fromDate = p.fromDate;
    query.toDate = p.toDate;
    if (p.scope === 'CUSTOMER') query.customerId = p.customerId;
    if (p.scope === 'SELLER') {
      query.sellerId = p.sellerId;
      query.bucketGroupBy = p.bucketGroupBy;
      query.bucketPeriodKey = p.bucketPeriodKey;
    }
  }

  const raw = await gatewayFetch('/admin/order-reports/growth/orders', orderListSchema, query);
  return mapOrderList(raw);
}
