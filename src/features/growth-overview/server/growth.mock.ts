import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import type { GrowthReport } from '../contracts';
import { mapGrowthReport } from './growth.mapper';
import { buildRawGrowthReport } from './growth.raw';
import { growthResponseSchema } from './growth.schema';

/**
 * Mock dựng response THÔ (chuỗi số, % ×100) rồi đi qua mapper —
 * cùng một đường biến đổi với dữ liệu BE, nên shape không thể lệch.
 */
export const growthMockSource = {
  async getReport(f: ReportFilters): Promise<GrowthReport> {
    return mapGrowthReport(growthResponseSchema.parse(buildRawGrowthReport(f)));
  },
};
