import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { isMockMode } from '@/platform/reports/source';
import type { SellerOrderQuery, SellerSource } from '../contracts';
import { sellerMockSource } from './seller.mock';
import { sellerHttpSource } from './seller.http';

/**
 * Summary: API 7 (mock hoặc http). Orders: API 2 chưa có → luôn mock.
 */
export const sellerSource: SellerSource = {
  getSummary: (sellerId: string, f: ReportFilters) =>
    isMockMode()
      ? sellerMockSource.getSummary(sellerId, f)
      : sellerHttpSource.getSummary(sellerId, f),
  listOrders: (sellerId: string, f: ReportFilters, q: SellerOrderQuery) =>
    sellerMockSource.listOrders(sellerId, f, q),
};
