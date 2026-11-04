import type { Delta, Money, OrderStatus } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';

export type OrderSummary = {
  orders: number;
  ordersDelta: Delta;
  aov: Money;
  aovDelta: Delta;
  cancelRate: number; // 0..1
  returnRate: number; // 0..1
};

export type OrderStatusBucket = {
  status: OrderStatus;
  count: number;
  gmv: Money;
};

/** HỢP ĐỒNG VỚI BE — không đổi signature, chỉ thêm method */
export interface OrderSource {
  getSummary(f: ReportFilters): Promise<OrderSummary>;
  getByStatus(f: ReportFilters): Promise<OrderStatusBucket[]>;
}
