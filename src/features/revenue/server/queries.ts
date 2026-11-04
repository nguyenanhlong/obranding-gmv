import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import { revenueSource } from './source';

/**
 * Tầng cache DUY NHẤT. fetch bên trong http.ts luôn no-store
 * để tránh cache hai tầng làm lệch số liệu.
 */
export const getRevenueSummary = unstable_cache(
  async (filters: ReportFilters) => revenueSource.getSummary(filters),
  ['revenue:summary'],
  { revalidate: 60, tags: [REPORT_TAGS.revenue] },
);

export const getRevenueTimeseries = unstable_cache(
  async (filters: ReportFilters) => revenueSource.getTimeseries(filters),
  ['revenue:timeseries'],
  { revalidate: 60, tags: [REPORT_TAGS.revenue] },
);

export const getRevenueByMarketplace = unstable_cache(
  async (filters: ReportFilters) => revenueSource.getByMarketplace(filters),
  ['revenue:by-marketplace'],
  { revalidate: 60, tags: [REPORT_TAGS.revenue] },
);
