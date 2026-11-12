import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
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
