import { parseFilters } from '@/platform/reports/filters';
import { clampToToday, filtersToQueryString, growthRangeError } from '@/platform/reports/filters';
import { ReportApiError } from '@/platform/reports/http';
import { GROUP_BY_LABEL } from '@/platform/reports/labels';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { EmptyState } from '@/platform/ui/empty-state';
import { ReportFilter } from '@/platform/ui/report-filter';
import { GrowthKpiRow } from '@/features/growth-overview/components/growth-kpis';
import { GrowthHub } from '@/features/growth-overview/components/growth-hub';
import { PeriodTable } from '@/features/growth-overview/components/period-table';
import { kpisOf } from '@/features/growth-overview/contracts';
import { getGrowthReport } from '@/features/growth-overview/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GrowthPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const rangeError = growthRangeError(filters);

  let report: Awaited<ReturnType<typeof getGrowthReport>> | null = null;
  let apiError: string | null = null;
  if (!rangeError) {
    try {
      report = await getGrowthReport(filters);
    } catch (error) {
      if (error instanceof ReportApiError) apiError = error.userMessage;
      else throw error;
    }
  }
  const selection = report ? kpisOf(report) : null;
  const groupBy = report?.meta.groupBy ?? filters.period.toUpperCase();
  const qs = filtersToQueryString(filters);
  const linkRange = clampToToday({ from: filters.from, to: filters.to }, filters.tz);
  const back = { from: filters.from, to: filters.to, period: filters.period };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Báo cáo tăng trưởng</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Đơn con theo nhà bán · tính theo ngày đặt hàng
            {report ? ` · ${GROUP_BY_LABEL[groupBy] ?? groupBy.toLowerCase()} · ${report.meta.totalPeriods} kỳ` : ''}
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

      {rangeError || apiError || !report ? (
        <EmptyState
          title={apiError ? 'Không tải được báo cáo tăng trưởng' : 'Khoảng thời gian vượt giới hạn của API'}
          description={apiError ?? rangeError ?? 'Không tải được dữ liệu.'}
        />
      ) : (
        <>
          <GrowthKpiRow selection={selection} />

          <ChartFrame
            title="Tăng trưởng theo kỳ"
            description="Bấm một mốc để ghim kỳ: 4 chỉ số và 3 danh sách top cập nhật theo kỳ đó"
          >
            <GrowthHub
              periods={report.periods}
              groupBy={groupBy}
              back={back}
              linkRange={linkRange}
              initialKey={selection?.period.key ?? report.periods[report.periods.length - 1]?.key ?? ''}
            />
          </ChartFrame>

          <ChartFrame title="Số liệu theo kỳ" description="Kỳ mới nhất ở trên cùng">
            <PeriodTable periods={report.periods} groupBy={groupBy} back={back} />
          </ChartFrame>
        </>
      )}
    </div>
  );
}
