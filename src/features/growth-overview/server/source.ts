import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { GrowthSource } from '../contracts';
import { growthMockSource } from './growth.mock';
import { growthHttpSource } from './growth.http';

/** Đổi nguồn bằng DATA_SOURCE, không sửa dòng nào khác. */
export const growthSource: GrowthSource = pickSource(growthMockSource, growthHttpSource);
