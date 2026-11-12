import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { isMockMode } from '@/platform/reports/source';
import type {
  PeriodBuyerQuery,
  PeriodOrderQuery,
  PeriodSellerQuery,
  PeriodSource,
} from '../contracts';
import { periodMockSource } from './period.mock';
import { periodHttpSource } from './period.http';

/**
 * M2 dùng 2 nguồn: summary = API 6, orders = API 2. Cùng đổi theo DATA_SOURCE.
 */
export const periodSource: PeriodSource = {
  getSummary: (f: ReportFilters) =>
    isMockMode() ? periodMockSource.getSummary(f) : periodHttpSource.getSummary(f),
  listOrders: (f: ReportFilters, q: PeriodOrderQuery) =>
    isMockMode() ? periodMockSource.listOrders(f, q) : periodHttpSource.listOrders(f, q),
  listBuyers: (f: ReportFilters, q: PeriodBuyerQuery) =>
    isMockMode() ? periodMockSource.listBuyers(f, q) : periodHttpSource.listBuyers(f, q),
  listSellers: (f: ReportFilters, q: PeriodSellerQuery) =>
    isMockMode() ? periodMockSource.listSellers(f, q) : periodHttpSource.listSellers(f, q),
};
