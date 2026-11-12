import { csvResponse, toCsv } from '@/platform/reports/csv';
import { rejectUnsupportedFormat } from '@/platform/reports/export';
import { entityRangeError, parseFilters, searchParamsToRecord } from '@/platform/reports/filters';
import { listSellerOrders } from '@/features/seller-detail/server/queries';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ sellerId: string }> };

export async function GET(req: Request, ctx: RouteContext) {
  const url = new URL(req.url);
  const blocked = rejectUnsupportedFormat(url.searchParams.get('format'));
  if (blocked) return blocked;

  const { sellerId } = await ctx.params;
  const filters = parseFilters(searchParamsToRecord(url.searchParams));
  const rangeError = entityRangeError(filters);
  if (rangeError) return Response.json({ error: rangeError }, { status: 400 });
  const detail = await listSellerOrders(sellerId, filters, { page: 1, pageSize: 5000 });
  if (detail.items.length === 0) return new Response('not found', { status: 404 });

  const rows = detail.items.map((o) => ({
    ma_don: o.orderPublicId,
    ngay_dat: o.placedAt,
    ma_kh: o.customerId ?? '',
    khach_hang: o.customerName ?? '',
    khu_vuc: o.regionName ?? '',
    so_san_pham: o.itemQuantity,
    gia_tri: o.orderTotalVnd,
    uu_dai: o.discountBadges.join('|'),
    thanh_toan: `${o.paymentMethod ?? ''}/${o.paymentStatus ?? ''}`,
    trang_thai: o.status,
  }));

  const csv = toCsv(rows, [
    'ma_don',
    'ngay_dat',
    'ma_kh',
    'khach_hang',
    'khu_vuc',
    'so_san_pham',
    'gia_tri',
    'thanh_toan',
    'trang_thai',
  ]);

  return csvResponse(csv, `seller-${sellerId}-${filters.from}_${filters.to}.csv`);
}
