import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import { buyerSource } from './source';

export const getBuyerDetail = unstable_cache(
  async (customerId: string, filters: ReportFilters, page: number, pageSize: number) =>
    buyerSource.getDetail(customerId, filters, page, pageSize),
  ['buyer:detail'],
  { revalidate: 60, tags: [REPORT_TAGS.buyer] },
);
