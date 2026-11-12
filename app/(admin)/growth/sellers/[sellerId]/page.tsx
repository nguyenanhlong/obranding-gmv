import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString, entityRangeError } from '@/platform/reports/filters';
import { formatDate } from '@/platform/format/date';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { EmptyState } from '@/platform/ui/empty-state';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import { ReportFilter } from '@/platform/ui/report-filter';
import { SellerSeriesChart } from '@/features/seller-detail/components/seller-series-chart';
import { SELLER_SERIES_TITLE } from '@/features/seller-detail/contracts';
import { getSellerSummary, listSellerOrders } from '@/features/seller-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SellerPage({ params, searchParams }: PageProps) {
  const { sellerId } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const rangeError = entityRangeError(filters);
  if (rangeError) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Chi tiết nhà bán</h1>
        <ReportFilter filters={filters} />
        <EmptyState title="Khoảng ngày không hợp lệ" description={rangeError} />
      </div>
    );
  }

  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePositiveInt(sp.pageSize, 10, 30);
  const bucketFrom = typeof sp.bucketFrom === 'string' ? sp.bucketFrom : undefined;
  const bucketTo = typeof sp.bucketTo === 'string' ? sp.bucketTo : undefined;

  const summary = await getSellerSummary(sellerId, filters);
  if (!summary) notFound();

  const orders = await listSellerOrders(sellerId, filters, {
    page,
    pageSize,
    from: bucketFrom,
    to: bucketTo,
  });

  const qs = filtersToQueryString(filters);
  const totalPages = Math.max(1, Math.ceil(orders.total / pageSize));
  const defFrom = typeof sp.defFrom === 'string' ? sp.defFrom : filters.from;
  const defTo = typeof sp.defTo === 'string' ? sp.defTo : filters.to;
  const bucketLabel = summary.series.buckets.find((b) => b.startDate === bucketFrom)?.label;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth?${qs}`} className="text-xs text-indigo-700 hover:underline">
            ← Quay lại báo cáo tăng trưởng
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{summary.seller.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Mã nhà bán {summary.seller.code} · {summary.seller.mainCategory ?? '—'}
          </p>
          <p className="text-sm text-slate-500">
            Khoảng thời gian: {formatDate(filters.from)} – {formatDate(filters.to)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/growth/sellers/${sellerId}?from=${defFrom}&to=${defTo}&period=${filters.period}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Về mặc định
          </Link>
          {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
            <a
              key={fmt}
              href={`/api/exports/seller/${sellerId}?${qs}&format=${fmt}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Xuất {fmt.toUpperCase()}
            </a>
          ))}
        </div>
      </div>

      <ReportFilter filters={filters} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Số đơn bán ra" value={formatCount(summary.kpis.orders)} hint="đơn con của nhà bán" />
        <KpiCard label="GMV" value={formatCompactMoney(summary.kpis.gmv)} hint="tổng orderTotal" />
        <KpiCard label="User tham gia mua" value={formatCount(summary.kpis.buyers)} hint="customerId không trùng" />
        <KpiCard label="Giá trị TB/đơn" value={formatCompactMoney(summary.kpis.aov)} hint="AOV" />
        <KpiCard
          label="Tỉ lệ hoàn thành"
          value={formatPercent(summary.kpis.completionRate)}
          hint={`${formatCount(summary.kpis.completedOrders)} đơn COMPLETED / tổng đơn`}
        />
        <KpiCard
          label="Đơn / user"
          value={summary.kpis.ordersPerBuyer.toFixed(2).replace('.', ',')}
          hint="mức độ mua lặp lại"
        />
      </div>

      <ChartFrame
        title={`Số đơn / GMV / User mua ${SELLER_SERIES_TITLE[summary.series.unit]}`}
        description={
          bucketLabel ? `Đang lọc: ${bucketLabel}` : 'Bấm một mốc để lọc danh sách đơn bên dưới'
        }
        actions={
          bucketFrom ? (
            <Link
              href={`/growth/sellers/${sellerId}?${qs}`}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Bỏ lọc mốc
            </Link>
          ) : null
        }
      >
        <SellerSeriesChart
          buckets={summary.series.buckets}
          basePath={`/growth/sellers/${sellerId}`}
          query={qs}
        />
      </ChartFrame>

      <ChartFrame
        title={`Đơn hàng của nhà bán (${formatCount(orders.total)})`}
        description="Danh sách đơn lấy từ API 2 — hiện là mock, chờ hợp đồng"
      >
        <OrderTable rows={orders.items} variant="seller" startIndex={(page - 1) * pageSize} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">Kết quả {formatCount(orders.total)}</span>
          <div className="flex items-center gap-2">
            <Link
              href={`/growth/sellers/${sellerId}?${qs}${bucketFrom ? `&bucketFrom=${bucketFrom}&bucketTo=${bucketTo}` : ''}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
              className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
              }`}
            >
              Trước
            </Link>
            <span className="px-1 text-sm tabular-nums text-slate-600">
              Trang {page}/{totalPages}
            </span>
            <Link
              href={`/growth/sellers/${sellerId}?${qs}${bucketFrom ? `&bucketFrom=${bucketFrom}&bucketTo=${bucketTo}` : ''}&page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}`}
              className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
              }`}
            >
              Tiếp tục
            </Link>
          </div>
        </div>
      </ChartFrame>
    </div>
  );
}
