import 'server-only';
import type { OrderRow } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';
import { allOrders } from '@/platform/mock/dataset';
import type { SellerOrderQuery, SellerSource } from '../contracts';
import { mapSellerSummary } from './seller.mapper';
import { buildRawSellerSummary } from './seller.raw';
import { sellerSummarySchema } from './seller.schema';

function inRange(row: OrderRow, from: string, to: string): boolean {
  const day = row.placedAt.slice(0, 10);
  return day >= from && day <= to;
}

export const sellerMockSource: SellerSource = {
  async getSummary(sellerId: string, f: ReportFilters) {
    const raw = buildRawSellerSummary(sellerId, f.from, f.to);
    return raw ? mapSellerSummary(sellerSummarySchema.parse(raw)) : null;
  },

  /** TODO (chờ API 2): danh sách đơn của nhà bán vẫn là mock. */
  async listOrders(sellerId, f, q: SellerOrderQuery) {
    const from = q.from ?? f.from;
    const to = q.to ?? f.to;

    const rows = allOrders()
      .filter((o) => o.sellerId === sellerId && inRange(o, from, to))
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
