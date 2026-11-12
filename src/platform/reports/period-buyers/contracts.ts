export type BuyerSortBy = 'ORDER_COUNT' | 'TOTAL_VALUE';

export type BuyerClassification = 'NEW' | 'RETURNING';

/** Một dòng của API 3 — mỗi customerId một dòng */
export type PeriodBuyerRow = {
  customerId: string;
  customerName: string | null;
  maskedPhone: string | null;
  orderCount: number;
  totalValueVnd: number;
  aovVnd: number;
  regionName: string | null;
  classification: BuyerClassification;
  /** ISO UTC */
  lastOrderAt: string;
};

export type PeriodBuyerMeta = {
  groupBy: string;
  periodKey: string;
  startDate: string;
  endDate: string;
  periodStatus: 'FINAL' | 'PROVISIONAL';
  timezone: string;
  dataAsOf: string;
  sortBy: BuyerSortBy;
};

export type PeriodBuyerPage = {
  meta: PeriodBuyerMeta;
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  items: PeriodBuyerRow[];
};

export type ListPeriodBuyersParams = {
  groupBy: string;
  periodKey: string;
  sortBy?: BuyerSortBy;
  q?: string;
  page: number;
  pageSize: number;
};

export const BUYER_SORT_LABEL: Record<BuyerSortBy, string> = {
  ORDER_COUNT: 'Số đơn',
  TOTAL_VALUE: 'Tổng giá trị',
};

export const CLASSIFICATION_LABEL: Record<BuyerClassification, string> = {
  NEW: 'Mới',
  RETURNING: 'Quay lại',
};

/** pageSize hợp đồng API 3/4 */
export const PAGE_SIZE_PERIOD_ENTITY = [10, 20, 30] as const;
