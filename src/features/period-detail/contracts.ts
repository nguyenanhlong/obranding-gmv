import type { OrderRow, Page } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

export type PeriodStatus = 'FINAL' | 'PROVISIONAL';

export type PeriodMetric = {
  value: number;
  previousValue: number | null;
  /** 0..1, null khi kỳ trước = 0 */
  growthPercent: number | null;
};

export type PeriodInfo = {
  key: string;
  label: string;
  /** DAY | WEEK | MONTH | QUARTER | YEAR */
  groupBy: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
};

export type DistributionUnit = 'HOUR' | 'WEEKDAY' | 'DAY' | 'WEEK' | 'MONTH';

export type DistributionBucket = {
  key: string;
  label: string;
  shortLabel: string;
  orders: number;
  /** mốc chưa tới (chỉ có ở kỳ PROVISIONAL) */
  isFuture: boolean;
};

export type PeriodSummary = {
  period: PeriodInfo;
  kpis: {
    orders: PeriodMetric;
    gmv: PeriodMetric;
    buyers: PeriodMetric;
    activeSellers: PeriodMetric;
    /** VND */
    aov: number;
    newBuyers: number;
    /** 0..1 */
    newBuyerRate: number;
  };
  distribution: {
    unit: DistributionUnit;
    buckets: DistributionBucket[];
    peak: DistributionBucket | null;
  };
};

export type PeriodOrderQuery = {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
};

/**
 * Nguồn dữ liệu của M2, tách đôi theo hợp đồng:
 * - getSummary  → API 6 (/growth/period-summary)
 * - listOrders  → API 2 (chưa có hợp đồng, hiện là mock)
 */
export interface PeriodSource {
  getSummary(f: ReportFilters): Promise<PeriodSummary>;
  listOrders(f: ReportFilters, q: PeriodOrderQuery): Promise<Page<OrderRow>>;
}

export { GROUP_BY_LABEL } from '@/platform/reports/labels';

/** Tiêu đề biểu đồ theo unit của API 6 */
export const UNIT_TITLE: Record<DistributionUnit, string> = {
  HOUR: 'Phân bổ đơn hàng theo giờ',
  WEEKDAY: 'Phân bổ đơn hàng theo ngày trong tuần',
  DAY: 'Phân bổ đơn hàng theo ngày',
  WEEK: 'Phân bổ đơn hàng theo tuần',
  MONTH: 'Phân bổ đơn hàng theo tháng',
};
