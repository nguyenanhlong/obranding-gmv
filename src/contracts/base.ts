// Ring 0 — hợp đồng dùng chung. Chỉ được THÊM, không đổi tên field.
// Owner: FE-A. Thay đổi phải là PR riêng có 2 reviewer.

export type IsoDate = string; // 'YYYY-MM-DD'
export type Currency = 'VND';

/** Số tiền luôn là số nguyên đơn vị nhỏ nhất (VND = đồng). Cấm string ở tầng view. */
export type Money = { amount: number; currency: Currency };

export type DateRange = { from: IsoDate; to: IsoDate };

export type DeltaDirection = 'up' | 'down' | 'flat';

export type Delta = {
  /** chênh tuyệt đối so với kỳ so sánh */
  value: number;
  /** % thay đổi; null khi kỳ trước = 0 (không chia được) */
  pct: number | null;
  direction: DeltaDirection;
  compareTo: DateRange | null;
};

export type Percent = number; // 0..1

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Granularity = 'day' | 'week' | 'month';
export type CompareMode = 'previous_period' | 'previous_year' | 'none';

export type Marketplace = { id: string; name: string; logoUrl?: string };

/** Sắc thái trạng thái dùng cho cả đơn hàng và buyer */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'returned';
