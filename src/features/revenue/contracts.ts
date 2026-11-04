import type { Delta, Marketplace, Money } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

export type RevenueSummary = {
  range: { from: string; to: string };
  gmv: Money;
  gmvDelta: Delta;
  orderCount: number;
  orderCountDelta: Delta;
  gmvPerDay: Money;
  /** null khi chưa đủ dữ liệu để tính (kỳ < 2 ngày) */
  growthRate: number | null;
};

export type TimeseriesPoint = {
  bucket: string; // '2026-11-01' | '2026-W44' | '2026-11'
  gmv: number; // VND, integer
  orders: number;
  buyers: number;
  /** kỳ so sánh, cùng độ dài; null khi không so sánh */
  gmvPrev?: number | null;
};

export type MarketplaceRevenue = {
  marketplace: Marketplace;
  gmv: Money;
  share: number; // 0..1
  delta: Delta;
};

export type RevenueReport = {
  summary: RevenueSummary;
  timeseries: TimeseriesPoint[];
  byMarketplace: MarketplaceRevenue[];
};

/** HỢP ĐỒNG VỚI BE — không đổi signature, chỉ thêm method */
export interface RevenueSource {
  getSummary(f: ReportFilters): Promise<RevenueSummary>;
  getTimeseries(f: ReportFilters): Promise<TimeseriesPoint[]>;
  getByMarketplace(f: ReportFilters): Promise<MarketplaceRevenue[]>;
}
