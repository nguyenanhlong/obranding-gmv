import { csvResponse, toCsv } from '@/platform/reports/csv';
import { rejectUnsupportedFormat } from '@/platform/reports/export';
import { parseFilters, searchParamsToRecord } from '@/platform/reports/filters';
import { getSellerDetail } from '@/features/seller-detail/server/queries';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ sellerId: string }> };

export async function GET(req: Request, ctx: RouteContext) {
  const url = new URL(req.url);
  const blocked = rejectUnsupportedFormat(url.searchParams.get('format'));
  if (blocked) return blocked;

  const { sellerId } = await ctx.params;
  const filters = parseFilters(searchParamsToRecord(url.searchParams));
  const detail = await getSellerDetail(sellerId, filters, 1, 5000);
  if (!detail) return new Response('not found', { status: 404 });

  const rows = detail.orders.items.map((o) => ({
    ma_don: o.publicId,
    ngay_dat: o.placedAt,
    ma_kh: o.customerId.replace('customer-', ''),
    khach_hang: o.customerName,
    khu_vuc: o.region,
    so_san_pham: o.itemCount,
    gia_tri: o.total.amount,
    thanh_toan: o.payment,
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
