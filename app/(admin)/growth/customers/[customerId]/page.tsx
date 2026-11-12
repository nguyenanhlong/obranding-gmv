import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseFilters, parsePageSize, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString, entityRangeError } from '@/platform/reports/filters';
import { formatDate } from '@/platform/format/date';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { EmptyState } from '@/platform/ui/empty-state';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import { ReportFilter } from '@/platform/ui/report-filter';
import { ORDER_STATUS_OPTIONS, PAGE_SIZE_ORDER } from '@/platform/reports/orders/contracts';
import { PageSizeSelect } from '@/features/period-detail/components/page-size-select';
import { BuyerSeriesChart } from '@/features/buyer-detail/components/buyer-series-chart';
import { BUYER_SERIES_TITLE, BUYER_TYPE_LABEL } from '@/features/buyer-detail/contracts';
import { getBuyerSummary, listBuyerOrders } from '@/features/buyer-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuyerPage({ params, searchParams }: PageProps) {
  const { customerId } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const rangeError = entityRangeError(filters);
  if (rangeError) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Chi tiết user</h1>
        <ReportFilter filters={filters} />
        <EmptyState title="Khoảng ngày không hợp lệ" description={rangeError} />
      </div>
    );
  }

  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePageSize(sp.pageSize, PAGE_SIZE_ORDER, 10);
  const q = typeof sp.q === 'string' && sp.q ? sp.q : undefined;
  const status = typeof sp.status === 'string' && sp.status ? sp.status : undefined;

  const summary = await getBuyerSummary(customerId, filters);
  if (!summary) notFound();

  const orders = await listBuyerOrders(customerId, filters, { page, pageSize, q, status });

  const qs = filtersToQueryString(filters);
  const totalPages = Math.max(1, Math.ceil(orders.total / pageSize));
  const defFrom = typeof sp.defFrom === 'string' ? sp.defFrom : filters.from;
  const defTo = typeof sp.defTo === 'string' ? sp.defTo : filters.to;
  const maxSellerValue = Math.max(1, ...summary.topSellers.map((s) => s.value));
  const lastOrder = summary.kpis.lastOrderAt ? formatDate(summary.kpis.lastOrderAt) : '—';

  const tableParams = new URLSearchParams(qs);
  if (q) tableParams.set('q', q);
  if (status && status !== 'ALL') tableParams.set('status', status);
  const tableQs = tableParams.toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth?${qs}`} className="text-xs text-indigo-700 hover:underline">
            ← Quay lại báo cáo tăng trưởng
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{summary.customer.name}</h1>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                summary.customer.buyerType === 'NEW'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {BUYER_TYPE_LABEL[summary.customer.buyerType]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Mã KH {summary.customer.id} · {summary.customer.phoneMasked ?? '—'} ·{' '}
            {summary.customer.province ?? '—'}
          </p>
          <p className="text-sm text-slate-500">
            Khoảng thời gian: {formatDate(filters.from)} – {formatDate(filters.to)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/growth/customers/${customerId}?from=${defFrom}&to=${defTo}&period=${filters.period}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Về mặc định
          </Link>
          {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
            <a
              key={fmt}
              href={`/api/exports/customer/${customerId}?${qs}&format=${fmt}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Xuất {fmt.toUpperCase()}
            </a>
          ))}
        </div>
      </div>

      <ReportFilter filters={filters} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Số đơn hàng"
          value={formatCount(summary.kpis.totalOrders)}
          hint={`${formatCount(summary.kpis.validOrders)} đơn hợp lệ`}
        />
        <KpiCard
          label="Tổng giá trị mua"
          value={formatCompactMoney(summary.kpis.totalValue)}
          hint="không gồm đơn huỷ"
        />
        <KpiCard label="Giá trị TB/đơn" value={formatCompactMoney(summary.kpis.aov)} hint="AOV của user" />
        <KpiCard
          label="Tỉ lệ hoàn thành"
          value={formatPercent(summary.kpis.completionRate)}
          hint={`${formatCount(summary.kpis.cancelledOrders)} đơn huỷ`}
        />
        <KpiCard
          label="Nhà bán đã mua"
          value={formatCount(summary.kpis.sellersCount)}
          hint="nhà bán khác nhau"
        />
        <KpiCard
          label="Đơn gần nhất"
          value={lastOrder}
          hint={
            summary.kpis.firstOrderAt
              ? `đơn đầu tiên ${formatDate(summary.kpis.firstOrderAt)}`
              : 'chưa có đơn'
          }
        />
      </div>

      <ChartFrame title={BUYER_SERIES_TITLE[summary.series.unit]}>
        <BuyerSeriesChart buckets={summary.series.buckets} />
      </ChartFrame>

      <ChartFrame title="Nhà bán mua nhiều nhất" description="Top 5 theo giá trị mua trong kỳ">
        {summary.topSellers.length === 0 ? (
          <EmptyState title="Kỳ này chưa có đơn" />
        ) : (
          <ul className="space-y-3">
            {summary.topSellers.map((seller) => (
              <li key={seller.sellerId} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/growth/sellers/${seller.sellerId}?${qs}`}
                    className="min-w-0 truncate text-sm text-slate-700 hover:underline"
                  >
                    {seller.sellerName}
                    <span className="ml-1.5 font-mono text-[11px] text-slate-400">
                      {seller.sellerCode}
                    </span>
                  </Link>
                  <span className="shrink-0 tabular-nums text-xs text-slate-500">
                    {seller.orders} đơn · {formatCompactMoney(seller.value)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${Math.max(4, (seller.value / maxSellerValue) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartFrame>

      <ChartFrame
        title={`Đơn hàng của ${summary.customer.name} (${formatCount(orders.total)})`}
        description="Danh sách đơn lấy từ API 2 theo khoảng thời gian đang chọn"
      >
        <form method="get" action="" className="mb-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="from" value={filters.from} />
          <input type="hidden" name="to" value={filters.to} />
          <input type="hidden" name="period" value={filters.period} />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm mã đơn / nhà bán"
            className="w-56 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            name="status"
            defaultValue={status ?? 'ALL'}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {ORDER_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Lọc
          </button>
          <span className="ml-auto text-xs text-slate-500">
            Hiển thị {pageSize} · trang {page}/{totalPages}
          </span>
        </form>

        <OrderTable rows={orders.items} variant="buyer" startIndex={(page - 1) * pageSize} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Kết quả {formatCount(orders.total)}</span>
            <PageSizeSelect
              value={pageSize}
              options={[...PAGE_SIZE_ORDER]}
              basePath={`/growth/customers/${customerId}`}
              query={tableQs}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/growth/customers/${customerId}?${tableQs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
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
              href={`/growth/customers/${customerId}?${tableQs}&page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}`}
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
