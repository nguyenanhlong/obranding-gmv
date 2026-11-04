import 'server-only';
import { reportFetch } from '@/platform/reports/http';
import { filtersToQueryString } from '@/platform/reports/filters';
import type { ReportFilters } from '@/platform/reports/filters';
import type { RevenueSource } from '../contracts';
import {
  mapMarketplace,
  mapSummary,
  mapTimeseries,
  toInt,
  type RawMarketplaceRevenue,
  type RawRevenueSummary,
  type RawTimeseriesPoint,
} from './revenue.mapper';

const query = (f: ReportFilters) =>
  Object.fromEntries(new URLSearchParams(filtersToQueryString(f)));

/**
 * Chỉ file này phải viết khi BE bàn giao.
 * Page/component/hook không đổi một dòng.
 */
export const revenueHttpSource: RevenueSource = {
  async getSummary(f) {
    const raw = await reportFetch<RawRevenueSummary>('/v1/reports/revenue/summary', query(f));
    return mapSummary(raw, f);
  },

  async getTimeseries(f) {
    const raw = await reportFetch<RawTimeseriesPoint[]>(
      '/v1/reports/revenue/timeseries',
      query(f),
    );
    return raw.map(mapTimeseries);
  },

  async getByMarketplace(f) {
    const raw = await reportFetch<RawMarketplaceRevenue[]>(
      '/v1/reports/revenue/by-marketplace',
      query(f),
    );
    const total = raw.reduce((acc, item) => acc + toInt(item.gmv), 0);
    return raw.map((item) => mapMarketplace(item, total));
  },
};
