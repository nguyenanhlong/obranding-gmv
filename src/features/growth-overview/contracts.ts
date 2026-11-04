import type { Delta, Money, Period } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

export type GrowthTab = 'metrics' | 'orders' | 'buyers';

export type KpiValue = { value: number; delta: Delta };

export type GrowthKpis = {
  orders: KpiValue;
  buyers: KpiValue;
  gmv: KpiValue & { money: Money };
  sellers: KpiValue;
};

export type GrowthPoint = {
  bucket: string;
  /** khoảng ngày thực của bucket — dùng cho drill-down */
  from: string;
  to: string;
  orders: number;
  gmv: number;
  buyers: number;
  sellers: number;
  /** % so với kỳ trước; null khi kỳ trước = 0 */
  growthPct: number | null;
  /** kỳ đang diễn ra → nhãn "tạm tính" */
  isCurrent: boolean;
};

export type TopSeller = {
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  category: string;
  orders: number;
  /** share trên tổng đơn của kỳ, 0..1 */
  share: number;
  gmv: Money;
  growthPct: number | null;
};

export type GrowthReport = {
  period: Period;
  range: { from: string; to: string };
  kpis: GrowthKpis;
  series: GrowthPoint[];
  topSellers: TopSeller[];
  totalSellers: number;
};

/** Khớp endpoint GET /admin/order-reports/growth (M3, mục 6) */
export interface GrowthSource {
  getReport(f: ReportFilters, topN: number): Promise<GrowthReport>;
}
