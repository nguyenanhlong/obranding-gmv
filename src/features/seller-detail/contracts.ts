import type { Money, OrderRow, Page, Period } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

export type SellerKpis = {
  orders: number;
  gmv: Money;
  buyers: number;
  aov: Money;
  /** 0..1 */
  completionRate: number;
  /** số đơn / số user tham gia mua */
  ordersPerUser: number;
};

export type SellerDetail = {
  seller: { id: string; code: string; name: string; category: string };
  range: { from: string; to: string };
  period: Period;
  kpis: SellerKpis;
  monthly: { bucket: string; orders: number; gmv: number; buyers: number }[];
  orders: Page<OrderRow>;
};

/** Khớp endpoint GET /admin/order-reports/growth/sellers/:sellerId (M3) */
export interface SellerSource {
  getDetail(
    sellerId: string,
    f: ReportFilters,
    page: number,
    pageSize: number,
  ): Promise<SellerDetail | null>;
}
