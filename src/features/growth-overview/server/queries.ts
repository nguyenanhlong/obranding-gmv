import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import { growthSource } from './source';

export const getGrowthReport = unstable_cache(
  async (filters: ReportFilters) => growthSource.getReport(filters),
  ['growth:report'],
  { revalidate: 60, tags: [REPORT_TAGS.growth] },
);
