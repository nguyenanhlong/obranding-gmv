import 'server-only';
import { reportFetch } from '@/platform/reports/http';
import { filtersToQueryString } from '@/platform/reports/filters';
import type { ReportFilters } from '@/platform/reports/filters';
import type { GrowthReport } from '../contracts';
import { mapGrowthReport, type RawGrowthReport } from './growth.mapper';

const query = (f: ReportFilters, topN: number) => ({
  ...Object.fromEntries(new URLSearchParams(filtersToQueryString(f))),
  topN,
});

export const growthHttpSource = {
  async getReport(f: ReportFilters, topN: number): Promise<GrowthReport> {
    const raw = await reportFetch<RawGrowthReport>('/admin/order-reports/growth', query(f, topN));
    return mapGrowthReport(raw, f.period);
  },
};
