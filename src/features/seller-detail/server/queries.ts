import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import { sellerSource } from './source';

export const getSellerDetail = unstable_cache(
  async (sellerId: string, filters: ReportFilters, page: number, pageSize: number) =>
    sellerSource.getDetail(sellerId, filters, page, pageSize),
  ['seller:detail'],
  { revalidate: 60, tags: [REPORT_TAGS.seller] },
);
