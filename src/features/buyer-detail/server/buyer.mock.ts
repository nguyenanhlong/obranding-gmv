import 'server-only';
import type { OrderRow } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';
import { allOrders } from '@/platform/mock/dataset';
import type { BuyerOrderQuery, BuyerSource } from '../contracts';
import { mapBuyerSummary } from './buyer.mapper';
import { buildRawBuyerSummary } from './buyer.raw';
import { buyerSummarySchema } from './buyer.schema';

function inRange(row: OrderRow, from: string, to: string): boolean {
  const day = row.placedAt.slice(0, 10);
  return day >= from && day <= to;
}

export const buyerMockSource: BuyerSource = {
  async getSummary(customerId: string, f: ReportFilters) {
    const raw = buildRawBuyerSummary(customerId, f.from, f.to);
    return raw ? mapBuyerSummary(buyerSummarySchema.parse(raw)) : null;
  },

  /** TODO (chờ API 2): danh sách đơn của khách vẫn là mock. */
  async listOrders(customerId, f, q: BuyerOrderQuery) {
    const from = q.from ?? f.from;
    const to = q.to ?? f.to;

    const rows = allOrders()
      .filter((o) => o.customerId === customerId && inRange(o, from, to))
      .sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));

    const start = (q.page - 1) * q.pageSize;
    return {
      items: rows.slice(start, start + q.pageSize),
      total: rows.length,
      page: q.page,
      pageSize: q.pageSize,
    };
  },
};
