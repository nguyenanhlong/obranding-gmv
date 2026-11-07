import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString } from '@/platform/reports/filters';
import { formatDateTime, formatRange } from '@/platform/format/date';
import { formatCompactMoney } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import { ReportFilter } from '@/platform/ui/report-filter';
import { getBuyerDetail } from '@/features/buyer-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuyerPage({ params, searchParams }: PageProps) {
  const { customerId } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePositiveInt(sp.pageSize, 10, 30);

  const detail = await getBuyerDetail(customerId, filters, page, pageSize);
  if (!detail) notFound();

  const qs = filtersToQueryString(filters);
  const maxMonthly = Math.max(1, ...detail.monthly.map((m) => m.amount));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth?${qs}`} className="text-xs text-indigo-700 hover:underline">
            ← Quay lại báo cáo tăng trưởng
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{detail.customer.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Mã KH {customerId.replace('customer-', '')} · {detail.customer.phone} ·{' '}
            {detail.customer.region}
          </p>
          <p className="text-sm text-slate-500">
            Khoảng thời gian: {formatRange(detail.range.from, detail.range.to)}
          </p>
        </div>
        <div className="flex gap-2">
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
        <KpiCard label="Số đơn hàng" value={String(detail.kpis.orders)} />
        <KpiCard
          label="Tổng giá trị mua"
          value={formatCompactMoney(detail.kpis.totalValue.amount)}
          delta={detail.totalValueDelta}
        />
        <KpiCard label="Giá trị TB/đơn" value={formatCompactMoney(detail.kpis.aov.amount)} />
        <KpiCard label="Tỉ lệ hoàn thành" value={formatPercent(detail.kpis.completionRate)} />
        <KpiCard label="Nhà bán đã mua" value={String(detail.kpis.sellerCount)} />
        <KpiCard
          label="Đơn gần nhất"
          value={detail.kpis.lastOrderAt ? formatDateTime(detail.kpis.lastOrderAt).slice(0, 10) : '—'}
        />
      </div>

      <ChartFrame title="Giá trị mua theo tháng">
        <div className="flex h-40 items-end gap-2">
          {detail.monthly.map((m) => (
            <div key={m.bucket} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-indigo-500/80"
                style={{ height: `${Math.max(2, (m.amount / maxMonthly) * 100)}%` }}
                title={`${m.bucket} · ${formatCompactMoney(m.amount)} · ${m.orders} đơn`}
              />
              <span className="text-[10px] text-slate-500">{m.bucket.slice(5)}</span>
            </div>
          ))}
        </div>
      </ChartFrame>

      <ChartFrame title="Nhà bán mua nhiều nhất" description="Top 5 theo số đơn trong kỳ">
        <ul className="space-y-2 text-sm">
          {detail.topSellers.map((s) => (
            <li key={s.sellerId} className="flex items-center justify-between gap-3">
              <Link
                href={`/growth/sellers/${s.sellerId}?${qs}`}
                className="truncate text-slate-700 hover:underline"
              >
                {s.sellerName}
              </Link>
              <span className="shrink-0 tabular-nums text-slate-500">
                {s.orders} đơn · {formatCompactMoney(s.gmv.amount)}
              </span>
            </li>
          ))}
        </ul>
      </ChartFrame>

      <ChartFrame title={`Đơn hàng của ${detail.customer.name} (${detail.orders.total})`}>
        <OrderTable
          rows={detail.orders.items}
          variant="buyer"
          startIndex={(page - 1) * pageSize}
        />
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Link
            href={`/growth/customers/${customerId}?${qs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
            className={`rounded border border-slate-300 px-3 py-1 ${
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
            }`}
          >
            Trước
          </Link>
          <span className="text-xs text-slate-500">Trang {page}</span>
          <Link
            href={`/growth/customers/${customerId}?${qs}&page=${page + 1}&pageSize=${pageSize}`}
            className={`rounded border border-slate-300 px-3 py-1 ${
              page * pageSize >= detail.orders.total ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
            }`}
          >
            Tiếp tục
          </Link>
        </div>
      </ChartFrame>
    </div>
  );
}
