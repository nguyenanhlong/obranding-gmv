import Link from 'next/link';
import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString, periodRangeError } from '@/platform/reports/filters';
import { formatDate } from '@/platform/format/date';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import type { Delta } from '@/contracts/base';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { EmptyState } from '@/platform/ui/empty-state';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import { ReportFilter } from '@/platform/ui/report-filter';
import { DistributionBars } from '@/features/period-detail/components/distribution-bars';
import { PageSizeSelect } from '@/features/period-detail/components/page-size-select';
import {
  GROUP_BY_LABEL,
  UNIT_TITLE,
  type PeriodMetric,
} from '@/features/period-detail/contracts';
import { getPeriodSummary, listPeriodOrders } from '@/features/period-detail/server/queries';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'PREPARING', label: 'Chuẩn bị hàng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
  { value: 'NEEDS_RESOLUTION', label: 'Cần giải quyết' },
];

const TABS = [
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'buyers', label: 'User mua hàng' },
  { key: 'sellers', label: 'Nhà bán' },
] as const;

function toDelta(metric: PeriodMetric): Delta {
  if (metric.previousValue === null || metric.growthPercent === null) {
    return { value: 0, pct: null, direction: 'flat' };
  }
  const value = metric.value - metric.previousValue;
  return {
    value,
    pct: metric.growthPercent,
    direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat',
  };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PeriodPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const rangeError = periodRangeError(filters);

  if (rangeError) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Chi tiết kỳ</h1>
        <ReportFilter filters={filters} />
        <EmptyState title="Khoảng ngày không hợp lệ cho kỳ này" description={rangeError} />
      </div>
    );
  }

  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePositiveInt(sp.pageSize, 10, 30);
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const status = typeof sp.status === 'string' ? sp.status : undefined;
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? 'orders';

  const [summary, orders] = await Promise.all([
    getPeriodSummary(filters),
    listPeriodOrders(filters, { page, pageSize, q, status }),
  ]);

  const { period, kpis, distribution } = summary;
  const qs = filtersToQueryString(filters);
  const totalPages = Math.max(1, Math.ceil(orders.total / pageSize));
  const dayOnly = period.startDate === period.endDate;
  const approximate = period.status === 'PROVISIONAL';

  const tabCount: Record<(typeof TABS)[number]['key'], number> = {
    orders: kpis.orders.value,
    buyers: kpis.buyers.value,
    sellers: kpis.activeSellers.value,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth?${qs}`} className="text-xs text-indigo-700 hover:underline">
            ← Quay lại biểu đồ
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">Chi tiết {period.label}</h1>
            {approximate ? (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Đang diễn ra · tạm tính
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {dayOnly
              ? formatDate(period.startDate)
              : `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`}{' '}
            · Chu kỳ {GROUP_BY_LABEL[period.groupBy] ?? period.groupBy.toLowerCase()} · tính trên đơn
            con theo nhà bán
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
        <KpiCard
          label="Tổng đơn hàng"
          value={formatCount(kpis.orders.value)}
          delta={toDelta(kpis.orders)}
          approximate={approximate}
        />
        <KpiCard
          label="GMV"
          value={formatCompactMoney(kpis.gmv.value)}
          delta={toDelta(kpis.gmv)}
          approximate={approximate}
        />
        <KpiCard
          label="User mua hàng"
          value={formatCount(kpis.buyers.value)}
          delta={toDelta(kpis.buyers)}
          approximate={approximate}
        />
        <KpiCard
          label="Nhà bán có đơn"
          value={formatCount(kpis.activeSellers.value)}
          delta={toDelta(kpis.activeSellers)}
          approximate={approximate}
        />
        <KpiCard
          label="AOV"
          value={formatCompactMoney(kpis.aov)}
          hint="GMV ÷ số đơn"
        />
        <KpiCard
          label="Tỉ lệ khách mới"
          value={formatPercent(kpis.newBuyerRate)}
          hint={`${formatCount(kpis.newBuyers)} khách mới trong kỳ`}
        />
      </div>

      <ChartFrame title={UNIT_TITLE[distribution.unit]}>
        <DistributionBars
          buckets={distribution.buckets}
          unit={distribution.unit}
          peak={distribution.peak}
        />
      </ChartFrame>

      <ChartFrame title="Chi tiết kỳ" description="Số liệu trên tab tính cùng thời điểm với 6 thẻ KPI">
        <nav className="mb-3 flex gap-1 border-b border-slate-200" aria-label="Tab chi tiết">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/growth/period?${qs}&tab=${t.key}&pageSize=${pageSize}`}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                t.key === tab
                  ? 'border-slate-900 font-medium text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-600">
                {formatCount(tabCount[t.key])}
              </span>
            </Link>
          ))}
        </nav>

        {tab === 'orders' ? (
          <>
            <form method="get" action="" className="mb-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="from" value={filters.from} />
              <input type="hidden" name="to" value={filters.to} />
              <input type="hidden" name="period" value={filters.period} />
              <input type="hidden" name="tab" value="orders" />
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

            <OrderTable rows={orders.items} variant="period" startIndex={(page - 1) * pageSize} />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Kết quả {formatCount(orders.total)}</span>
                <PageSizeSelect value={pageSize} basePath="/growth/period" query={`${qs}&tab=orders`} />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/growth/period?${qs}&tab=orders&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
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
                  href={`/growth/period?${qs}&tab=orders&page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Tiếp tục
                </Link>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={tab === 'buyers' ? 'Danh sách user mua hàng' : 'Danh sách nhà bán'}
            description="Chờ hợp đồng API 3/4 từ BE. Số đếm trên tab lấy từ API 6 nên đã đúng."
          />
        )}
      </ChartFrame>
    </div>
  );
}
