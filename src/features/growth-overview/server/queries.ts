import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import { growthSource } from './source';

/** Tầng cache DUY NHẤT — fetch bên trong http.ts luôn no-store. */
export const getGrowthReport = unstable_cache(
  async (filters: ReportFilters, topN: number) => growthSource.getReport(filters, topN),
  ['growth:report'],
  { revalidate: 60, tags: [REPORT_TAGS.growth] },
);
