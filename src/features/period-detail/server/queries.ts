import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import type { PeriodQuery } from '../contracts';
import { periodSource } from './source';

export const getPeriodDetail = unstable_cache(
  async (filters: ReportFilters, query: PeriodQuery) => periodSource.getDetail(filters, query),
  ['period:detail'],
  { revalidate: 60, tags: [REPORT_TAGS.period] },
);
