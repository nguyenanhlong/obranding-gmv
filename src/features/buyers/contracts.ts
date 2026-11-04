import type { Delta, Money } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

export type BuyerSummary = {
  totalBuyers: number;
  buyersDelta: Delta;
  newBuyers: number;
  returningBuyers: number;
  newRatio: number; // 0..1
  repeatRate: number; // 0..1
  arpu: Money;
};

export type CohortRow = {
  cohort: string; // '2026-10'
  cohortSize: number;
  /** m[0] = kỳ đầu; null = chưa đủ dữ liệu */
  retention: Array<number | null>;
};

export type TopBuyer = {
  userId: string;
  displayName: string;
  orders: number;
  gmv: Money;
  lastOrderAt: string; // ISO
};

/** HỢP ĐỒNG VỚI BE — không đổi signature, chỉ thêm method */
export interface BuyerSource {
  getSummary(f: ReportFilters): Promise<BuyerSummary>;
  getCohort(f: ReportFilters): Promise<CohortRow[]>;
  getTop(f: ReportFilters, limit: number): Promise<TopBuyer[]>;
}
