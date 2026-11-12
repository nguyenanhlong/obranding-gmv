import 'server-only';
import { gatewayFetch } from '@/platform/reports/http';
import { toApiQuery } from '@/platform/reports/filters';
import type { PeriodSource } from '../contracts';
import { mapPeriodSummary } from './period.mapper';
import { periodSummarySchema } from './period.schema';

/**
 * API 6 — period-summary.
 * listOrders chưa có (API 2), source.ts sẽ nối phần đó vào mock.
 */
export const periodHttpSource: Pick<PeriodSource, 'getSummary'> = {
  async getSummary(f) {
    const raw = await gatewayFetch(
      '/admin/order-reports/growth/period-summary',
      periodSummarySchema,
      toApiQuery(f),
    );
    return mapPeriodSummary(raw);
  },
};
