import 'server-only';
import { gatewayFetch } from '@/platform/reports/http';
import { toApiQuery, type ReportFilters } from '@/platform/reports/filters';
import type { GrowthReport } from '../contracts';
import { mapGrowthReport } from './growth.mapper';
import { growthResponseSchema } from './growth.schema';

export const growthHttpSource = {
  async getReport(f: ReportFilters): Promise<GrowthReport> {
    const raw = await gatewayFetch(
      '/admin/order-reports/growth',
      growthResponseSchema,
      toApiQuery(f),
    );
    return mapGrowthReport(raw);
  },
};
