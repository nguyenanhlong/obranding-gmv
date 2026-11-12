import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ReportFilters } from '@/platform/reports/filters';
import { REPORT_TAGS } from '@/platform/reports/tags';
import type { BuyerOrderQuery } from '../contracts';
import { buyerSource } from './source';
import { dataMode } from '@/platform/reports/source';

export const getBuyerSummary = unstable_cache(
  async (customerId: string, filters: ReportFilters) =>
    buyerSource.getSummary(customerId, filters),
  ['buyer:summary', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.buyer] },
);

/** TODO API 2 */
export const listBuyerOrders = unstable_cache(
  async (customerId: string, filters: ReportFilters, query: BuyerOrderQuery) =>
    buyerSource.listOrders(customerId, filters, query),
  ['buyer:orders', dataMode()],
  { revalidate: 60, tags: [REPORT_TAGS.buyer] },
);
