import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString } from '@/platform/reports/filters';
import { formatRange } from '@/platform/format/date';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { KpiCard } from '@/platform/ui/kpi-card';
import { OrderTable } from '@/platform/ui/order-table';
import { ReportFilter } from '@/platform/ui/report-filter';
import { getSellerDetail } from '@/features/seller-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SellerPage({ params, searchParams }: PageProps) {
  const { sellerId } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = parsePositiveInt(sp.page, 1, 9999);
  const pageSize = parsePositiveInt(sp.pageSize, 10, 30);

  const detail = await getSellerDetail(sellerId, filters, page, pageSize);
  if (!detail) notFound();

  const qs = filtersToQueryString(filters);
  const maxOrders = Math.max(1, ...detail.monthly.map((m) => m.orders));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/growth?${qs}`} className="text-xs text-indigo-700 hover:underline">
            ← Quay lại báo cáo tăng trưởng
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{detail.seller.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Mã nhà bán {detail.seller.code} · {detail.seller.category}
          </p>
          <p className="text-sm text-slate-500">
            Khoảng thời gian: {formatRange(detail.range.from, detail.range.to)}
          </p>
        </div>
        <div className="flex gap-2">
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
        <KpiCard label="Số đơn bán ra" value={formatCount(detail.kpis.orders)} />
        <KpiCard label="GMV" value={formatCompactMoney(detail.kpis.gmv.amount)} />
        <KpiCard label="User tham gia mua" value={formatCount(detail.kpis.buyers)} />
        <KpiCard label="Giá trị TB/đơn" value={formatCompactMoney(detail.kpis.aov.amount)} />
        <KpiCard label="Tỉ lệ hoàn thành" value={formatPercent(detail.kpis.completionRate)} />
        <KpiCard
          label="Đơn / user"
          value={detail.kpis.ordersPerUser.toFixed(2).replace('.', ',')}
          hint="mức độ mua lặp lại"
        />
      </div>

      <ChartFrame
        title="Số đơn theo tháng"
        description="Rê chuột để xem số đơn, GMV và user mua"
      >
        <div className="flex h-40 items-end gap-2">
          {detail.monthly.map((m) => (
            <div key={m.bucket} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-slate-700/80"
                style={{ height: `${Math.max(2, (m.orders / maxOrders) * 100)}%` }}
                title={`${m.bucket} · ${m.orders} đơn · ${formatCompactMoney(m.gmv)} · ${m.buyers} user`}
              />
              <span className="text-[10px] text-slate-500">{m.bucket.slice(5)}</span>
            </div>
          ))}
        </div>
      </ChartFrame>

      <ChartFrame title={`Đơn hàng của nhà bán (${formatCount(detail.orders.total)})`}>
        <OrderTable
          rows={detail.orders.items}
          variant="seller"
          startIndex={(page - 1) * pageSize}
        />
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Link
            href={`/growth/sellers/${sellerId}?${qs}&page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
            className={`rounded border border-slate-300 px-3 py-1 ${
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
            }`}
          >
            Trước
          </Link>
          <span className="text-xs text-slate-500">Trang {page}</span>
          <Link
            href={`/growth/sellers/${sellerId}?${qs}&page=${page + 1}&pageSize=${pageSize}`}
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
