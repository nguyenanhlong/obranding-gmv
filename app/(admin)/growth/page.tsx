import { parseFilters, parsePositiveInt } from '@/platform/reports/filters';
import { filtersToQueryString, growthRangeError } from '@/platform/reports/filters';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { EmptyState } from '@/platform/ui/empty-state';
import { ReportFilter } from '@/platform/ui/report-filter';
import { GrowthKpiRow } from '@/features/growth-overview/components/growth-kpis';
import { GrowthLine } from '@/features/growth-overview/components/growth-line';
import { PeriodTable } from '@/features/growth-overview/components/period-table';
import { TopBuyersPanel } from '@/features/growth-overview/components/top-buyers';
import { TopSellersTable } from '@/features/growth-overview/components/top-sellers-table';
import { kpisOf } from '@/features/growth-overview/contracts';
import { getGrowthReport } from '@/features/growth-overview/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GrowthPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const topN = parsePositiveInt(sp.topN, 3, 10);
  const rangeError = growthRangeError(filters);

  const report = rangeError ? null : await getGrowthReport(filters);
  const selection = report ? kpisOf(report) : null;
  const groupBy = report?.meta.groupBy ?? filters.period.toUpperCase();
  const qs = filtersToQueryString(filters);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Báo cáo tăng trưởng</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Đơn con theo nhà bán · tính theo ngày đặt hàng
            {report ? ` · ${groupBy.toLowerCase()} · ${report.meta.totalPeriods} kỳ` : ''}
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

      {rangeError || !report ? (
        <EmptyState
          title="Khoảng thời gian vượt giới hạn của API"
          description={rangeError ?? 'Không tải được dữ liệu.'}
        />
      ) : (
        <>
          <GrowthKpiRow selection={selection} />

          <ChartFrame
            title="Tăng trưởng theo kỳ"
            description={
              selection?.approximate
                ? 'Kỳ đang diễn ra · số liệu tạm tính, % so với đoạn tương ứng của kỳ trước'
                : 'Số liệu theo kỳ đã chốt gần nhất'
            }
          >
            <GrowthLine periods={report.periods} groupBy={groupBy} />
          </ChartFrame>

          <ChartFrame
            title={`Top ${topN} nhà bán theo số đơn`}
            description={selection ? selection.period.label : undefined}
            actions={
              <div className="flex gap-1">
                {[3, 5, 10].map((n) => (
                  <a
                    key={n}
                    href={`/growth?${qs}&topN=${n}`}
                    className={`rounded px-2 py-1 text-xs ${
                      n === topN ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Top {n}
                  </a>
                ))}
              </div>
            }
          >
            <TopSellersTable period={selection?.period ?? null} topN={topN} groupBy={groupBy} />
          </ChartFrame>

          <ChartFrame
            title="Top user mua hàng"
            description="API 1 trả sẵn 10 dòng mỗi danh sách · API 3 (danh sách đầy đủ) chưa có hợp đồng"
          >
            <TopBuyersPanel period={selection?.period ?? null} groupBy={groupBy} />
          </ChartFrame>

          <ChartFrame title="Số liệu theo kỳ" description="Kỳ mới nhất ở trên cùng">
            <PeriodTable periods={report.periods} groupBy={groupBy} />
          </ChartFrame>
        </>
      )}
    </div>
  );
}
