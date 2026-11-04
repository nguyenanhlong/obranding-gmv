import type { Money, OrderRow, Page, Period } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';
import type { Delta } from '@/contracts/base';

export type KpiValue = { value: number; delta: Delta };

export type PeriodKpis = {
  orders: KpiValue;
  gmv: KpiValue & { money: Money };
  buyers: KpiValue;
  sellers: KpiValue;
  aov: KpiValue & { money: Money };
  /** 0..1 */
  newBuyerRate: number;
};

export type DailyBucket = { date: string; orders: number };

export type PeriodDetail = {
  range: { from: string; to: string };
  period: Period;
  kpis: PeriodKpis;
  daily: DailyBucket[];
  peak: DailyBucket | null;
  orders: Page<OrderRow>;
};

export type PeriodQuery = {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
};

/** Khớp endpoint GET /admin/order-reports/growth/period (M3) */
export interface PeriodSource {
  getDetail(f: ReportFilters, q: PeriodQuery): Promise<PeriodDetail>;
}
