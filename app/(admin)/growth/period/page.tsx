import Link from 'next/link';
import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString } from '@/platform/reports/filters';
import { formatDate, formatRange } from '@/platform/format/date';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import { ReportFilter } from '@/platform/ui/report-filter';
import { DailyBars } from '@/features/period-detail/components/daily-bars';
import { getPeriodDetail } from '@/features/period-detail/server/queries';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'PREPARING', label: 'Chuẩn bị hàng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
  { value: 'NEEDS_RESOLUTION', label: 'Cần giải quyết' },
];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PeriodPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePositiveInt(sp.pageSize, 10, 30);
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const status = typeof sp.status === 'string' ? sp.status : undefined;

  const detail = await getPeriodDetail(filters, { page, pageSize, q, status });
  const { kpis } = detail;
  const qs = filtersToQueryString(filters);
  const totalPages = Math.max(1, Math.ceil(detail.orders.total / pageSize));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth?${qs}`} className="text-xs text-indigo-700 hover:underline">
            ← Quay lại biểu đồ
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Chi tiết {formatRange(filters.from, filters.to)}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatDate(filters.from)} – {formatDate(filters.to)} · chu kỳ {filters.period} ·
            tính trên đơn con theo nhà bán
          </p>
        </div>
        <div className="flex gap-2">
          {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
            <a
              key={fmt}
              href={`/api/exports/period?${qs}&format=${fmt}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Xuất {fmt.toUpperCase()}
            </a>
          ))}
        </div>
      </div>

      <ReportFilter filters={filters} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Tổng đơn hàng" value={formatCount(kpis.orders.value)} delta={kpis.orders.delta} />
        <KpiCard label="GMV" value={formatCompactMoney(kpis.gmv.money.amount)} delta={kpis.gmv.delta} />
        <KpiCard label="User mua hàng" value={formatCount(kpis.buyers.value)} delta={kpis.buyers.delta} />
        <KpiCard label="Nhà bán có đơn" value={formatCount(kpis.sellers.value)} delta={kpis.sellers.delta} />
        <KpiCard
          label="AOV"
          value={formatCompactMoney(kpis.aov.money.amount)}
          hint="GMV ÷ số đơn"
        />
        <KpiCard
          label="Tỉ lệ khách mới"
          value={formatPercent(kpis.newBuyerRate)}
          hint="đơn đầu tiên trong kỳ"
        />
      </div>

      <ChartFrame title="Phân bổ đơn hàng theo ngày">
        <DailyBars daily={detail.daily} peak={detail.peak} />
      </ChartFrame>

      <ChartFrame
        title={`Đơn hàng (${formatCount(detail.orders.total)})`}
        description="Tìm theo mã đơn, nhà bán hoặc khách hàng"
      >
        <form method="get" action="" className="mb-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="from" value={filters.from} />
          <input type="hidden" name="to" value={filters.to} />
          <input type="hidden" name="period" value={filters.period} />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm kiếm"
            className="w-56 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            name="status"
            defaultValue={status ?? 'ALL'}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
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

        <OrderTable
          rows={detail.orders.items}
          variant="period"
          startIndex={(page - 1) * pageSize}
        />

        <div className="mt-3 flex items-center gap-2 text-sm">
          <Link
            href={`/growth/period?${qs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
            className={`rounded border border-slate-300 px-3 py-1 ${
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
            }`}
          >
            Trước
          </Link>
          <span className="text-xs text-slate-500">Trang {page}</span>
          <Link
            href={`/growth/period?${qs}&page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}`}
            className={`rounded border border-slate-300 px-3 py-1 ${
              page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
            }`}
          >
            Tiếp tục
          </Link>
        </div>
      </ChartFrame>
    </div>
  );
}
