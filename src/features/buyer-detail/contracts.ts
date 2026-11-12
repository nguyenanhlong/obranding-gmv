import type { Page } from '@/contracts/base';
import type { GrowthOrderRow } from '@/platform/reports/orders/contracts';
import type { ReportFilters } from '@/platform/reports/filters';
import type { SeriesUnit } from '@/platform/reports/series';

export type BuyerType = 'NEW' | 'RETURNING';

export type BuyerInfo = {
  id: string;
  name: string;
  phoneMasked: string | null;
  province: string | null;
  buyerType: BuyerType;
};

export type BuyerKpis = {
  /** gồm cả đơn huỷ */
  totalOrders: number;
  /** không gồm đơn huỷ */
  validOrders: number;
  cancelledOrders: number;
  /** VND, không gồm đơn huỷ */
  totalValue: number;
  /** VND */
  aov: number;
  completedOrders: number;
  /** 0..1, tính trên totalOrders (đơn huỷ là không hoàn thành) */
  completionRate: number;
  sellersCount: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

export type BuyerSeriesBucket = {
  key: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  /** số đơn không huỷ trong mốc */
  orders: number;
  /** VND */
  value: number;
};

export type BuyerTopSeller = {
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  orders: number;
  value: number;
};

export type BuyerSummary = {
  customer: BuyerInfo;
  kpis: BuyerKpis;
  series: { unit: SeriesUnit; buckets: BuyerSeriesBucket[] };
  /** tối đa 5, xếp theo giá trị giảm dần */
  topSellers: BuyerTopSeller[];
};

export type BuyerOrderQuery = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  q?: string;
  status?: string;
};

/** API 8 trả summary; danh sách đơn là API 2 (chưa có hợp đồng). */
export interface BuyerSource {
  getSummary(customerId: string, f: ReportFilters): Promise<BuyerSummary | null>;
  listOrders(
    customerId: string,
    f: ReportFilters,
    q: BuyerOrderQuery,
  ): Promise<Page<GrowthOrderRow>>;
}

export const BUYER_SERIES_TITLE: Record<SeriesUnit, string> = {
  DAY: 'Giá trị mua theo ngày',
  MONTH: 'Giá trị mua theo tháng',
  QUARTER: 'Giá trị mua theo quý',
};

export const BUYER_TYPE_LABEL: Record<BuyerType, string> = {
  NEW: 'Khách mới',
  RETURNING: 'Quay lại',
};
