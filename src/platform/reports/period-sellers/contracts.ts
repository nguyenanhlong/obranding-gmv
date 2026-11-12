/** Một dòng của API 4 — mỗi sellerId một dòng, xếp cố định theo GMV */
export type PeriodSellerRow = {
  sellerId: string;
  sellerCode: string | null;
  sellerName: string | null;
  primaryCategoryName: string | null;
  orderCount: number;
  gmvVnd: number;
  buyerCount: number;
  /** % đã ×100, null khi periodGMV = 0 */
  gmvSharePercent: number | null;
};

export type PeriodSellerMeta = {
  groupBy: string;
  periodKey: string;
  startDate: string;
  endDate: string;
  periodStatus: 'FINAL' | 'PROVISIONAL';
  timezone: string;
  dataAsOf: string;
};

export type PeriodSellerPage = {
  meta: PeriodSellerMeta;
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  items: PeriodSellerRow[];
};

export type ListPeriodSellersParams = {
  groupBy: string;
  periodKey: string;
  q?: string;
  page: number;
  pageSize: number;
};
