import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import type { SellerOrderQuery } from '../contracts';
import { sellerSource } from './source';
import { dataMode } from '@/platform/reports/source';

export const getSellerSummary = unstable_cache(
  async (sellerId: string, filters: ReportFilters) =>
    sellerSource.getSummary(sellerId, filters),
  ['seller:summary', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.seller] },
);

/** TODO API 2 */
export const listSellerOrders = unstable_cache(
  async (sellerId: string, filters: ReportFilters, query: SellerOrderQuery) =>
    sellerSource.listOrders(sellerId, filters, query),
  ['seller:orders', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.seller] },
);
