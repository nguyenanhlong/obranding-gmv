// Ring 0 — hợp đồng dùng chung. Chỉ được THÊM, không đổi tên field.
// Owner: FE-A (Chinh). Thay đổi phải là PR riêng có 2 reviewer.

export type IsoDate = string; // 'YYYY-MM-DD'
export type IsoDateTime = string; // ISO 8601

export type Money = { amount: number; currency: 'VND' };

/** Chu kỳ gom số liệu — khớp filter "Xem theo" ở màn M1 */
export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NEEDS_RESOLUTION';

export type DeltaDirection = 'up' | 'down' | 'flat';

export type Delta = {
  value: number;
  /** null khi kỳ trước = 0 — không được hiển thị 0% */
  pct: number | null;
  direction: DeltaDirection;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type TabKey = 'orders' | 'buyers' | 'sellers';

/**
 * Một dòng đơn con (parent_order_id IS NOT NULL) — dùng chung cho
 * bảng đơn ở M2 (chi tiết kỳ), M4 (chi tiết user), M5 (chi tiết nhà bán).
 */
export type OrderRow = {
  id: string;
  publicId: string;
  placedAt: IsoDateTime;
  status: OrderStatus;
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  customerId: string;
  customerName: string;
  category: string;
  region: string;
  itemCount: number;
  payment: 'COD' | 'PREPAID';
  discounts: { label: string; amount: number }[];
  total: Money;
};

/** Nhãn hiển thị cố định cho trạng thái đơn */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ xử lý',
  PREPARING: 'Chuẩn bị hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  NEEDS_RESOLUTION: 'Cần giải quyết',
};
