import { revalidateTag } from 'next/cache';
import { REPORT_TAG_PATTERN } from '@/platform/reports/tags';

/**
 * BE gọi khi có số liệu mới:
 *   POST /api/reports/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "tag": "reports:revenue" }
 *
 * Dùng regex thay vì allowlist để thêm slice mới không phải sửa file này.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return new Response('unauthorized', { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { tag?: string };
  const tag = body.tag;

  if (!tag || !REPORT_TAG_PATTERN.test(tag)) {
    return Response.json({ revalidated: false, reason: 'invalid tag' }, { status: 400 });
  }

  revalidateTag(tag);
  return Response.json({ revalidated: true, tag, at: new Date().toISOString() });
}
