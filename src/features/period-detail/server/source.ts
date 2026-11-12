import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { isMockMode } from '@/platform/reports/source';
import type { PeriodOrderQuery, PeriodSource } from '../contracts';
import { periodMockSource } from './period.mock';
import { periodHttpSource } from './period.http';

/**
 * M2 dùng 2 nguồn:
 * - summary: API 6 (mock hoặc http theo DATA_SOURCE)
 * - orders:  API 2 chưa có hợp đồng → luôn mock, TODO thay khi BE xong
 */
export const periodSource: PeriodSource = {
  getSummary: (f: ReportFilters) =>
    isMockMode() ? periodMockSource.getSummary(f) : periodHttpSource.getSummary(f),
  listOrders: (f: ReportFilters, q: PeriodOrderQuery) => periodMockSource.listOrders(f, q),
};
