import { parseFilters } from '@/platform/reports/filters';
import { ChartFrame } from '@/platform/ui/chart-frame';
import { SectionPlaceholder } from '@/platform/ui/section-placeholder';
import { RevenueKpis } from '@/features/revenue/components/revenue-kpis';
import { getRevenueSummary } from '@/features/revenue/server/queries';

type SlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RevenueSlot({ searchParams }: SlotProps) {
  const filters = parseFilters(await searchParams);
  const summary = await getRevenueSummary(filters);

  return (
    <section aria-label="Doanh thu và tăng trưởng" className="space-y-4">
      <RevenueKpis summary={summary} />

      <ChartFrame
        title="Tăng trưởng GMV"
        description="GMV, đơn hàng và người mua theo kỳ đã chọn"
        actions={
          <a
            href={`/api/reports/revenue/export?${new URLSearchParams({
              from: filters.from,
              to: filters.to,
              granularity: filters.granularity,
            }).toString()}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
        }
      >
        <SectionPlaceholder
          owner="FE-B"
          title="Growth chart (Recharts)"
          scope="GMV · đơn hàng · người mua, có đường kỳ so sánh"
          className="h-64"
        />
      </ChartFrame>

      <ChartFrame title="Doanh thu theo sàn" description="Tỷ trọng GMV và mức tăng so với kỳ trước">
        <SectionPlaceholder
          owner="FE-B"
          title="Bảng / cột theo sàn"
          scope="dùng getRevenueByMarketplace + DataTable của UI kit"
          className="h-40"
        />
      </ChartFrame>
    </section>
  );
}
