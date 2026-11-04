import 'server-only';
import { unstable_cache } from 'next/cache';
import { REPORT_TAGS } from '@/platform/reports/tags';
import { orderSource } from './source';

export const getOrderDetail = unstable_cache(
  async (publicId: string) => orderSource.get(publicId),
  ['order:detail'],
  { revalidate: 60, tags: [REPORT_TAGS.order] },
);
