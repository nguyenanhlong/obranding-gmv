import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import type { PeriodBuyerQuery, PeriodSellerQuery } from '../contracts';
import { REPORT_TAGS } from '@/platform/reports/tags';
import type { PeriodOrderQuery } from '../contracts';
import { periodSource } from './source';
import { dataMode } from '@/platform/reports/source';

export const getPeriodSummary = unstable_cache(
  async (filters: ReportFilters) => periodSource.getSummary(filters),
  ['period:summary', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.period] },
);

/** TODO API 2: giữ cache riêng để khi nối BE chỉ đổi một chỗ. */
export const listPeriodOrders = unstable_cache(
  async (filters: ReportFilters, query: PeriodOrderQuery) =>
    periodSource.listOrders(filters, query),
  ['period:orders', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.period] },
);

/** API 3 — tab User mua hàng */
export const listPeriodBuyers = unstable_cache(
  async (filters: ReportFilters, query: PeriodBuyerQuery) =>
    periodSource.listBuyers(filters, query),
  ['period:buyers', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.period] },
);

/** API 4 — tab Nhà bán */
export const listPeriodSellers = unstable_cache(
  async (filters: ReportFilters, query: PeriodSellerQuery) =>
    periodSource.listSellers(filters, query),
  ['period:sellers', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.period] },
);
