import type { OrderRow } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';
import { filterRange } from '@/platform/mock/aggregate';
import { allOrders } from '@/platform/mock/dataset';
import type { PeriodOrderQuery, PeriodSource } from '../contracts';
import { mapPeriodSummary } from './period.mapper';
import { buildRawPeriodSummary } from './period.raw';

function matches(row: OrderRow, q: string | undefined, status: string | undefined): boolean {
  if (status && status !== 'ALL' && row.status !== status) return false;
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    row.publicId.toLowerCase().includes(needle) ||
    row.sellerName.toLowerCase().includes(needle) ||
    row.customerName.toLowerCase().includes(needle)
  );
}

export const periodMockSource: PeriodSource = {
  async getSummary(f: ReportFilters) {
    return mapPeriodSummary(buildRawPeriodSummary(f));
  },

  /**
   * TODO (chờ API 2): đây là phần duy nhất còn mock trong M2.
   * Khi BE có hợp đồng danh sách đơn, thay đúng hàm này bằng gatewayFetch.
   */
  async listOrders(f: ReportFilters, query: PeriodOrderQuery) {
    const orders = filterRange(allOrders(), f.from, f.to)
      .filter((o) => matches(o, query.q, query.status))
      .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));

    const start = (query.page - 1) * query.pageSize;
    return {
      items: orders.slice(start, start + query.pageSize),
      total: orders.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
};
