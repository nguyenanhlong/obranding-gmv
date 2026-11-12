import type { Period } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

/** Chỉ số BE trả cho mỗi kỳ (giá trị đã parse, % đã đổi về 0..1) */
export type GrowthMetric = {
  value: number;
  previousValue: number | null;
  /** 0..1, null khi kỳ trước = 0 */
  growthPercent: number | null;
};

export type GrowthStatus = 'FINAL' | 'PROVISIONAL';

export type TopBuyer = {
  customerId: string;
  customerName: string;
  orders: number;
  /** tổng order_total trong kỳ, VND */
  value: number;
};

export type TopSeller = {
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  category: string;
  orders: number;
  /** VND */
  gmv: number;
  /** tỉ trọng đơn của kỳ, 0..1 */
  orderShare: number;
  /** 0..1 */
  growthPercent: number | null;
};

export type GrowthPeriod = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  status: GrowthStatus;
  orders: GrowthMetric;
  buyers: GrowthMetric;
  gmv: GrowthMetric;
  activeSellers: GrowthMetric;
  /** VND */
  aov: number;
  topBuyersByOrders: TopBuyer[];
  topBuyersByValue: TopBuyer[];
  topSellersByOrders: TopSeller[];
};

export type GrowthMeta = {
  startDate: string;
  endDate: string;
  /** DAY | WEEK | MONTH | QUARTER | YEAR */
  groupBy: string;
  totalPeriods: number;
};

export type GrowthReport = {
  meta: GrowthMeta;
  periods: GrowthPeriod[];
};

/** 4 thẻ KPI lấy từ kỳ FINAL cuối cùng (hoặc PROVISIONAL nếu chỉ có kỳ đó). */
export type GrowthKpiSelection = {
  period: GrowthPeriod;
  /** true khi phải dùng kỳ PROVISIONAL → hiện % với tiền tố "~" */
  approximate: boolean;
};

export function kpisOf(report: GrowthReport): GrowthKpiSelection | null {
  const periods = report.periods;
  if (periods.length === 0) return null;

  for (let i = periods.length - 1; i >= 0; i -= 1) {
    const period = periods[i];
    if (period && period.status === 'FINAL') return { period, approximate: false };
  }

  const last = periods[periods.length - 1];
  return last ? { period: last, approximate: true } : null;
}

export type GrowthMetricKey = 'orders' | 'buyers' | 'gmv';

export function metricOf(period: GrowthPeriod, key: GrowthMetricKey): GrowthMetric {
  return period[key];
}

/** groupBy HOA của BE → Period của FE */
export function periodOf(groupBy: string): Period {
  return groupBy.toLowerCase() as Period;
}

/** Khớp endpoint GET /admin/order-reports/growth */
export interface GrowthSource {
  getReport(f: ReportFilters): Promise<GrowthReport>;
}
