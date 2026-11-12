import type { Delta } from '@/contracts/base';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { KpiCard } from '@/platform/ui/kpi-card';
import { EmptyState } from '@/platform/ui/empty-state';
import type { GrowthKpiSelection, GrowthMetric } from '../contracts';

function toDelta(metric: GrowthMetric): Delta {
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

/** 4 thẻ KPI của M1 — lấy từ kỳ FINAL cuối (hoặc PROVISIONAL + "~"). */
export function GrowthKpiRow({ selection }: { selection: GrowthKpiSelection | null }) {
  if (!selection) {
    return (
      <EmptyState
        title="Chưa có kỳ nào trong khoảng đã chọn"
        description="Thử mở rộng khoảng thời gian hoặc chọn chu kỳ khác."
      />
    );
  }

  const { period, approximate } = selection;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Đơn hàng"
        value={formatCount(period.orders.value)}
        delta={toDelta(period.orders)}
        approximate={approximate}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="User mua hàng"
        value={formatCount(period.buyers.value)}
        delta={toDelta(period.buyers)}
        approximate={approximate}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="GMV"
        value={formatCompactMoney(period.gmv.value)}
        delta={toDelta(period.gmv)}
        approximate={approximate}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="Nhà bán có đơn"
        value={formatCount(period.activeSellers.value)}
        delta={toDelta(period.activeSellers)}
        approximate={approximate}
        hint="so với kỳ trước"
      />
    </div>
  );
}
