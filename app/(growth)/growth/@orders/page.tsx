import { parseFilters } from '@/platform/reports/filters';
import { formatRange } from '@/platform/format/date';
import { SectionPlaceholder } from '@/platform/ui/section-placeholder';

type SlotProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersSlot({ searchParams }: SlotProps) {
  const filters = parseFilters(await searchParams);

  return (
    <section aria-label="Đơn hàng và người mua" className="space-y-4">
      <SectionPlaceholder
        owner="FE-C"
        title="Đơn hàng & người mua"
        scope={`Kỳ ${formatRange(filters.from, filters.to)} · funnel trạng thái, new vs returning, cohort, top buyer`}
        className="h-48"
      />
    </section>
  );
}
