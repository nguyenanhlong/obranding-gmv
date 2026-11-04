import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { RevenueSource } from '../contracts';
import { revenueMockSource } from './revenue.mock';
import { revenueHttpSource } from './revenue.http';

/** Đổi nguồn bằng DATA_SOURCE, không sửa dòng nào khác. */
export const revenueSource: RevenueSource = pickSource(revenueMockSource, revenueHttpSource);

export function revenueDataMode(): 'mock' | 'api' {
  return process.env.DATA_SOURCE === 'api' ? 'api' : 'mock';
}
