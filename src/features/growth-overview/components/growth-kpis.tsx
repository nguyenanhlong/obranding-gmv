import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { KpiCard } from '@/platform/ui/kpi-card';
import type { GrowthKpis } from '../contracts';

/** 4 tile KPI của M1 — đúng thứ tự trong design */
export function GrowthKpiRow({ kpis }: { kpis: GrowthKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Đơn hàng"
        value={formatCount(kpis.orders.value)}
        delta={kpis.orders.delta}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="User mua hàng"
        value={formatCount(kpis.buyers.value)}
        delta={kpis.buyers.delta}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="GMV"
        value={formatCompactMoney(kpis.gmv.money.amount)}
        delta={kpis.gmv.delta}
        hint="so với kỳ trước"
      />
      <KpiCard
        label="Nhà bán có đơn"
        value={formatCount(kpis.sellers.value)}
        delta={kpis.sellers.delta}
        hint="so với kỳ trước"
      />
    </div>
  );
}
