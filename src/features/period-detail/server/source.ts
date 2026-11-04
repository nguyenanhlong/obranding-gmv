import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { PeriodSource } from '../contracts';
import { periodMockSource } from './period.mock';

/**
 * TODO (FE-B): khi BE bàn giao, thêm `period.http.ts` implement `PeriodSource`
 * bằng `reportFetch('/admin/order-reports/growth/period', ...)` rồi đổi ở đây.
 * Không sửa page/component.
 */
export const periodSource: PeriodSource = pickSource(periodMockSource, periodMockSource);
