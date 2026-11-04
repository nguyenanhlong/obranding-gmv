import Link from 'next/link';
import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString } from '@/platform/reports/filters';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { ReportFilter } from '@/platform/ui/report-filter';
import { GrowthBars } from '@/features/growth-overview/components/growth-bars';
import { GrowthKpiRow } from '@/features/growth-overview/components/growth-kpis';
import { TopSellersTable } from '@/features/growth-overview/components/top-sellers-table';
import { getGrowthReport } from '@/features/growth-overview/server/queries';
import { formatBucket } from '@/platform/format/date';
import { formatCount } from '@/platform/format/money';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'metrics', label: 'Chỉ số tăng trưởng' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'buyers', label: 'User mua hàng' },
] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GrowthPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const topN = parsePositiveInt(sp.topN, 3, 10);
  const report = await getGrowthReport(filters, topN);
  const qs = filtersToQueryString(filters);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Báo cáo tăng trưởng</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Đơn con theo nhà bán · tính theo ngày đặt hàng
          </p>
        </div>

        {/* TODO FE-A: XLSX và PDF đang trả 501 — cần chốt thư viện xuất file */}
        <div className="flex gap-2">
          {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
            <a
              key={fmt}
              href={`/api/exports/growth?${qs}&format=${fmt}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Xuất {fmt.toUpperCase()}
            </a>
          ))}
        </div>
      </div>

      <ReportFilter filters={filters} />

      <nav className="flex gap-1 border-b border-slate-200" aria-label="Tab chỉ số">
        {TABS.map((tab, i) => (
          <Link
            key={tab.key}
            href={`/growth?${qs}&tab=${tab.key}`}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              i === 0
                ? 'border-slate-900 font-medium text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <GrowthKpiRow kpis={report.kpis} />

      <ChartFrame
        title="Tăng trưởng đơn hàng theo tháng"
        description="Rê chuột để xem số liệu · bấm một mốc để mở chi tiết kỳ"
        actions={
          <span className="text-xs text-slate-500">
            {report.period === 'month' ? `12 kỳ` : `${report.series.length} kỳ`}
          </span>
        }
      >
        <GrowthBars series={report.series} period={report.period} />
      </ChartFrame>

      <ChartFrame
        title={`Top ${topN} nhà bán theo số đơn`}
        description="Kỳ đã chốt gần nhất · bấm mã nhà bán để xem chi tiết"
        actions={
          <div className="flex gap-1">
            {[3, 5, 10].map((n) => (
              <Link
                key={n}
                href={`/growth?${qs}&topN=${n}`}
                className={`rounded px-2 py-1 text-xs ${
                  n === topN ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Top {n}
              </Link>
            ))}
          </div>
        }
      >
        <TopSellersTable rows={report.topSellers} totalSellers={report.totalSellers} topN={topN} />
      </ChartFrame>

      <ChartFrame title="Số liệu theo tháng" description="12 kỳ gần nhất">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {report.series.slice(-12).map((point) => (
            <li key={point.bucket} className="flex items-center justify-between gap-2 py-1">
              <span className="text-slate-500">{formatBucket(point.bucket, report.period)}</span>
              <span className="tabular-nums text-slate-800">{formatCount(point.orders)}</span>
            </li>
          ))}
        </ul>
      </ChartFrame>
    </div>
  );
}
