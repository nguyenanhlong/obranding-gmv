import Link from 'next/link';
import {
  clampToToday,
  parseFilters,
  parsePageSize,
  parsePositiveInt,
} from '@/platform/reports/filters';
import { filtersToQueryString, periodRangeError } from '@/platform/reports/filters';
import { ReportApiError } from '@/platform/reports/http';
import { formatDate } from '@/platform/format/date';
import { todayIn } from '@/platform/time';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import type { Delta, Page } from '@/contracts/base';
import type { GrowthOrderRow } from '@/platform/reports/orders/contracts';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { EmptyState } from '@/platform/ui/empty-state';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import {
  ORDER_STATUS_OPTIONS,
  PAGE_SIZE_ORDER,
} from '@/platform/reports/orders/contracts';
import {
  BUYER_SORT_LABEL,
  PAGE_SIZE_PERIOD_ENTITY,
  type BuyerSortBy,
  type PeriodBuyerPage,
} from '@/platform/reports/period-buyers/contracts';
import type { PeriodSellerPage } from '@/platform/reports/period-sellers/contracts';
import { DistributionBars } from '@/features/period-detail/components/distribution-bars';
import { PageSizeSelect } from '@/features/period-detail/components/page-size-select';
import { PeriodBuyersTable } from '@/features/period-detail/components/period-buyers-table';
import { PeriodSellersTable } from '@/features/period-detail/components/period-sellers-table';
import {
  GROUP_BY_LABEL,
  UNIT_TITLE,
  type PeriodMetric,
  type PeriodSummary,
} from '@/features/period-detail/contracts';
import {
  getPeriodSummary,
  listPeriodBuyers,
  listPeriodOrders,
  listPeriodSellers,
} from '@/features/period-detail/server/queries';

export const dynamic = 'force-dynamic';

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
        <EmptyState title="Khoảng ngày không hợp lệ cho kỳ này" description={rangeError} />
      </div>
    );
  }

  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? 'orders';
  const allowedPageSizes = tab === 'orders' ? PAGE_SIZE_ORDER : PAGE_SIZE_PERIOD_ENTITY;
  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePageSize(sp.pageSize, allowedPageSizes, 10);
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 100) : undefined;
  const status = typeof sp.status === 'string' ? sp.status : undefined;
  const sortBy: BuyerSortBy = sp.sortBy === 'TOTAL_VALUE' ? 'TOTAL_VALUE' : 'ORDER_COUNT';

  // Badge của tab luôn là số của lần tải đầu q rỗng (API 3/4), API 2 orders lấy từ API 6.
  let summary: PeriodSummary;
  let orders: Page<GrowthOrderRow> | null = null;
  let buyerBadge: PeriodBuyerPage;
  let sellerBadge: PeriodSellerPage;
  let buyers: PeriodBuyerPage | null = null;
  let sellers: PeriodSellerPage | null = null;

  try {
    [summary, orders, buyerBadge, sellerBadge] = await Promise.all([
      getPeriodSummary(filters),
      tab === 'orders'
        ? listPeriodOrders(filters, { page, pageSize, q, status })
        : Promise.resolve(null),
      listPeriodBuyers(filters, { page: 1, pageSize: 10, q: '', sortBy: 'ORDER_COUNT' }),
      listPeriodSellers(filters, { page: 1, pageSize: 10, q: '' }),
    ]);

    if (tab === 'buyers') {
      const needReload = Boolean(q) || sortBy !== 'ORDER_COUNT' || page !== 1 || pageSize !== 10;
      buyers = needReload
        ? await listPeriodBuyers(filters, { page, pageSize, q, sortBy })
        : buyerBadge;
    }

    if (tab === 'sellers') {
      const needReload = Boolean(q) || page !== 1 || pageSize !== 10;
      sellers = needReload
        ? await listPeriodSellers(filters, { page, pageSize, q })
        : sellerBadge;
    }
  } catch (error) {
    if (error instanceof ReportApiError) {
      return (
        <div className="space-y-5">
          <h1 className="text-xl font-semibold text-slate-900">Chi tiết kỳ</h1>
          <EmptyState title="Không tải được dữ liệu kỳ" description={error.userMessage} />
        </div>
      );
    }
    throw error;
  }

  const { period, kpis, distribution } = summary;
  const qs = filtersToQueryString(filters);
  const today = todayIn(filters.tz);
  const backFrom = (typeof sp.backFrom === 'string' && sp.backFrom) || period.startDate;
  const backToRaw = (typeof sp.backTo === 'string' && sp.backTo) || period.endDate;
  const backTo = backToRaw > today ? today : backToRaw;
  const backPeriod =
    (typeof sp.backPeriod === 'string' && sp.backPeriod) || period.groupBy.toLowerCase();
  const tabCount: Record<(typeof TABS)[number]['key'], number> = {
    orders: kpis.orders.value,
    buyers: buyerBadge.pagination.totalItems,
    sellers: sellerBadge.pagination.totalItems,
  };
  const dayOnly = period.startDate === period.endDate;
  const approximate = period.status === 'PROVISIONAL';

  // Link sang trang chi tiết: from/to = biên kỳ, to kẹp về hôm nay.
  const linkRange = clampToToday({ from: period.startDate, to: period.endDate }, filters.tz);
  const detailQs = new URLSearchParams({
    from: linkRange.from,
    to: linkRange.to,
    period: period.groupBy.toLowerCase(),
  }).toString();

  const ordersQuery = new URLSearchParams(qs);
  ordersQuery.set('tab', 'orders');
  if (q) ordersQuery.set('q', q);
  if (status && status !== 'ALL') ordersQuery.set('status', status);
  const ordersQs = ordersQuery.toString();

  const buyersQuery = new URLSearchParams(qs);
  buyersQuery.set('tab', 'buyers');
  if (q) buyersQuery.set('q', q);
  if (sortBy !== 'ORDER_COUNT') buyersQuery.set('sortBy', sortBy);
  const buyersQs = buyersQuery.toString();

  const sellersQuery = new URLSearchParams(qs);
  sellersQuery.set('tab', 'sellers');
  if (q) sellersQuery.set('q', q);
  const sellersQs = sellersQuery.toString();

  const ordersTotalPages = orders ? Math.max(1, Math.ceil(orders.total / pageSize)) : 1;
  const buyersTotalPages = buyers
    ? Math.max(1, Math.ceil(buyers.pagination.totalItems / pageSize))
    : 1;
  const sellersTotalPages = sellers
    ? Math.max(1, Math.ceil(sellers.pagination.totalItems / pageSize))
    : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/growth?from=${backFrom}&to=${backTo}&period=${backPeriod}`}
            className="text-xs text-indigo-700 hover:underline"
          >
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
              href={`/growth/period?${qs}&tab=${t.key}`}
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

        {tab === 'orders' && orders ? (
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
                maxLength={100}
                placeholder="Mã đơn, mã/tên khách, nhà bán"
                className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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
                Hiển thị {pageSize} · trang {page}/{ordersTotalPages}
              </span>
            </form>

            <OrderTable rows={orders.items} variant="period" startIndex={(page - 1) * pageSize} />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Kết quả {formatCount(orders.total)}</span>
                <PageSizeSelect
                  value={pageSize}
                  options={[...PAGE_SIZE_ORDER]}
                  basePath="/growth/period"
                  query={ordersQs}
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/growth/period?${ordersQs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Trước
                </Link>
                <span className="px-1 text-sm tabular-nums text-slate-600">
                  Trang {page}/{ordersTotalPages}
                </span>
                <Link
                  href={`/growth/period?${ordersQs}&page=${Math.min(ordersTotalPages, page + 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page >= ordersTotalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Tiếp tục
                </Link>
              </div>
            </div>
          </>
        ) : null}

        {tab === 'buyers' && buyers ? (
          <>
            <form method="get" action="" className="mb-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="from" value={filters.from} />
              <input type="hidden" name="to" value={filters.to} />
              <input type="hidden" name="period" value={filters.period} />
              <input type="hidden" name="tab" value="buyers" />
              {sortBy !== 'ORDER_COUNT' ? (
                <input type="hidden" name="sortBy" value={sortBy} />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={q ?? ''}
                maxLength={100}
                placeholder="Tên, số điện thoại hoặc mã khách"
                className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
              >
                Tìm
              </button>

              <div className="ml-auto flex items-center gap-1">
                <span className="text-xs text-slate-500">Sắp xếp:</span>
                {(['ORDER_COUNT', 'TOTAL_VALUE'] as const).map((key) => (
                  <Link
                    key={key}
                    href={`/growth/period?${qs}&tab=buyers${q ? `&q=${encodeURIComponent(q)}` : ''}${
                      key === 'ORDER_COUNT' ? '' : `&sortBy=${key}`
                    }`}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      sortBy === key
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {BUYER_SORT_LABEL[key]}
                  </Link>
                ))}
              </div>
            </form>

            <PeriodBuyersTable
              rows={buyers.items}
              startIndex={(page - 1) * pageSize}
              linkQuery={detailQs}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Kết quả {formatCount(buyers.pagination.totalItems)}
                </span>
                <PageSizeSelect
                  value={pageSize}
                  options={[...PAGE_SIZE_PERIOD_ENTITY]}
                  basePath="/growth/period"
                  query={buyersQs}
                />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/growth/period?${buyersQs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Trước
                </Link>
                <span className="px-1 text-sm tabular-nums text-slate-600">
                  Trang {page}/{buyersTotalPages}
                </span>
                <Link
                  href={`/growth/period?${buyersQs}&page=${Math.min(buyersTotalPages, page + 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page >= buyersTotalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Tiếp tục
                </Link>
              </div>
            </div>
          </>
        ) : null}

        {tab === 'sellers' && sellers ? (
          <>
            <form method="get" action="" className="mb-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="from" value={filters.from} />
              <input type="hidden" name="to" value={filters.to} />
              <input type="hidden" name="period" value={filters.period} />
              <input type="hidden" name="tab" value="sellers" />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ''}
                maxLength={100}
                placeholder="Mã hoặc tên nhà bán"
                className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
              >
                Tìm
              </button>
              <span className="ml-auto text-xs text-slate-500">
                Xếp theo GMV giảm dần · Hiển thị {pageSize} · trang {page}/{sellersTotalPages}
              </span>
            </form>

            <PeriodSellersTable
              rows={sellers.items}
              startIndex={(page - 1) * pageSize}
              linkQuery={detailQs}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Kết quả {formatCount(sellers.pagination.totalItems)}
                </span>
                <PageSizeSelect
                  value={pageSize}
                  options={[...PAGE_SIZE_PERIOD_ENTITY]}
                  basePath="/growth/period"
                  query={sellersQs}
                />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/growth/period?${sellersQs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
                  }`}
                >
                  Trước
                </Link>
                <span className="px-1 text-sm tabular-nums text-slate-600">
                  Trang {page}/{sellersTotalPages}
                </span>
                <Link
                  href={`/growth/period?${sellersQs}&page=${Math.min(sellersTotalPages, page + 1)}&pageSize=${pageSize}`}
                  className={`inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-sm ${
                    page >= sellersTotalPages
                      ? 'pointer-events-none opacity-40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  Tiếp tục
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </ChartFrame>
    </div>
  );
}
