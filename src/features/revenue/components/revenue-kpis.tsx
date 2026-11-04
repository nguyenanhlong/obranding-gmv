import { formatCount, formatMoney } from '@/platform/format/money';
import { formatPercent } from '@/platform/format/percent';
import { KpiCard } from '@/platform/ui/kpi-card';
import type { RevenueSummary } from '../contracts';

/** Reference implementation — FE-B mở rộng thêm chart và bảng theo Figma. */
export function RevenueKpis({ summary }: { summary: RevenueSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="GMV"
        value={formatMoney(summary.gmv.amount)}
        delta={summary.gmvDelta}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="Đơn hàng"
        value={formatCount(summary.orderCount)}
        delta={summary.orderCountDelta}
      />
      <KpiCard label="GMV / ngày" value={formatMoney(summary.gmvPerDay.amount)} />
      <KpiCard
        label="Tăng trưởng"
        value={summary.growthRate === null ? '—' : formatPercent(summary.growthRate)}
        hint={summary.growthRate === null ? 'chưa đủ dữ liệu' : 'so với kỳ trước'}
      />
    </div>
  );
}
