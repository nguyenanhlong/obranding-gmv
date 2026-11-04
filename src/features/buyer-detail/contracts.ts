import type { Money, OrderRow, Page, Period } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';
import type { Delta } from '@/contracts/base';

export type BuyerKpis = {
  orders: number;
  totalValue: Money;
  aov: Money;
  /** 0..1 */
  completionRate: number;
  sellerCount: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
};

export type BuyerDetail = {
  customer: { id: string; name: string; phone: string; region: string };
  range: { from: string; to: string };
  period: Period;
  kpis: BuyerKpis;
  monthly: { bucket: string; amount: number; orders: number }[];
  topSellers: { sellerId: string; sellerName: string; orders: number; gmv: Money }[];
  orders: Page<OrderRow>;
  /** % tăng trưởng giá trị mua so với kỳ trước */
  totalValueDelta: Delta;
};

/** Khớp endpoint GET /admin/order-reports/growth/customers/:customerId (M3) */
export interface BuyerSource {
  getDetail(
    customerId: string,
    f: ReportFilters,
    page: number,
    pageSize: number,
  ): Promise<BuyerDetail | null>;
}
