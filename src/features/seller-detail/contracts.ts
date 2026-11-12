import type { Page } from '@/contracts/base';
import type { GrowthOrderRow } from '@/platform/reports/orders/contracts';
import type { ReportFilters } from '@/platform/reports/filters';
import type { SeriesUnit } from '@/platform/reports/series';

export type SellerInfo = {
  id: string;
  code: string;
  name: string;
  /** danh mục chính trong khoảng, null khi không có đơn */
  mainCategory: string | null;
};

export type SellerKpis = {
  orders: number;
  /** VND */
  gmv: number;
  buyers: number;
  /** VND */
  aov: number;
  completedOrders: number;
  /** 0..1 */
  completionRate: number;
  /** 2 chữ số thập phân */
  ordersPerBuyer: number;
};

export type SellerSeriesBucket = {
  key: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  orders: number;
  gmv: number;
  buyers: number;
};

export type SellerSummary = {
  seller: SellerInfo;
  kpis: SellerKpis;
  series: { unit: SeriesUnit; buckets: SellerSeriesBucket[] };
};

export type SellerOrderQuery = {
  page: number;
  pageSize: number;
  /** key mốc trên biểu đồ (?bucket=), unit lấy từ series của API 7 */
  bucket?: string;
  bucketGroupBy?: string;
  bucketPeriodKey?: string;
  q?: string;
  status?: string;
};

/** API 7 trả summary; danh sách đơn là API 2 (chưa có hợp đồng). */
export interface SellerSource {
  getSummary(sellerId: string, f: ReportFilters): Promise<SellerSummary | null>;
  listOrders(
    sellerId: string,
    f: ReportFilters,
    q: SellerOrderQuery,
  ): Promise<Page<GrowthOrderRow>>;
}

export const SELLER_SERIES_TITLE: Record<SeriesUnit, string> = {
  DAY: 'theo ngày',
  MONTH: 'theo tháng',
  QUARTER: 'theo quý',
};

export type SellerMetricKey = 'orders' | 'gmv' | 'buyers';

export const SELLER_METRIC_LABEL: Record<SellerMetricKey, string> = {
  orders: 'Số đơn',
  gmv: 'GMV',
  buyers: 'User mua',
};
