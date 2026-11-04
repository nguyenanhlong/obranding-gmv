import { csvResponse, toCsv } from '@/platform/reports/csv';
import { rejectUnsupportedFormat } from '@/platform/reports/export';
import { parseFilters, searchParamsToRecord } from '@/platform/reports/filters';
import { getPeriodDetail } from '@/features/period-detail/server/queries';

export const dynamic = 'force-dynamic';

const MAX_EXPORT_ROWS = 5000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blocked = rejectUnsupportedFormat(url.searchParams.get('format'));
  if (blocked) return blocked;

  const filters = parseFilters(searchParamsToRecord(url.searchParams));
  const detail = await getPeriodDetail(filters, { page: 1, pageSize: MAX_EXPORT_ROWS });

  const rows = detail.orders.items.map((o) => ({
    ma_don: o.publicId,
    ngay_dat: o.placedAt,
    ma_nha_ban: o.sellerCode,
    ten_nha_ban: o.sellerName,
    ma_kh: o.customerId.replace('customer-', ''),
    khach_hang: o.customerName,
    danh_muc: o.category,
    khu_vuc: o.region,
    gia_tri: o.total.amount,
    thanh_toan: o.payment,
    trang_thai: o.status,
  }));

  const csv = toCsv(rows, [
    'ma_don',
    'ngay_dat',
    'ma_nha_ban',
    'ten_nha_ban',
    'ma_kh',
    'khach_hang',
    'danh_muc',
    'khu_vuc',
    'gia_tri',
    'thanh_toan',
    'trang_thai',
  ]);

  return csvResponse(csv, `period-${filters.from}_${filters.to}.csv`);
}
