import type { Page } from '@/contracts/base';

/** Trạng thái đã chuẩn hoá theo API 2 */
export type GrowthOrderStatus =
  | 'PENDING_PROCESSING'
  | 'PREPARING_SHIPMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NEEDS_RESOLUTION';

export type GrowthOrderStatusFilter = GrowthOrderStatus | 'ALL';

export type DiscountBadgeKind =
  | 'SANH'
  | 'PRODUCT_DISCOUNT'
  | 'SELLER_VOUCHER'
  | 'PLATFORM_VOUCHER'
  | 'SHIPPING_SUPPORT';

export type PaymentMethod = 'COD' | 'NO_CASH' | 'REFUND';
export type PaymentStatus = 'waiting' | 'success' | 'failed';

/** Một dòng đơn — đúng contract API 2 (không có id nội bộ) */
export type GrowthOrderRow = {
  orderPublicId: string;
  orderNumber: string;
  /** ISO UTC */
  placedAt: string;
  sellerId: string | null;
  sellerCode: string | null;
  sellerName: string | null;
  customerId: string | null;
  customerName: string | null;
  primaryCategoryName: string | null;
  itemQuantity: number;
  regionName: string | null;
  /** VND */
  orderTotalVnd: number;
  discountBadges: DiscountBadgeKind[];
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  status: GrowthOrderStatus;
  sourceStatus: string;
  state: string | null;
};

export type OrderScope = 'PERIOD' | 'CUSTOMER' | 'SELLER';

export type ListGrowthOrdersParams = {
  scope: OrderScope;
  page: number;
  pageSize: number;
  q?: string;
  status?: GrowthOrderStatusFilter;
  /** PERIOD */
  groupBy?: string;
  periodKey?: string;
  /** CUSTOMER */
  customerId?: string;
  /** SELLER */
  sellerId?: string;
  /** CUSTOMER | SELLER */
  fromDate?: string;
  toDate?: string;
  /** SELLER: lọc theo mốc chart */
  bucketGroupBy?: string;
  bucketPeriodKey?: string;
};

export type OrderListMeta = {
  scope: OrderScope;
  groupBy: string | null;
  periodKey: string | null;
  customerId: string | null;
  sellerId: string | null;
  startDate: string;
  endDate: string;
  listStartDate: string;
  listEndDate: string;
  bucketGroupBy: string | null;
  bucketPeriodKey: string | null;
  periodStatus: 'FINAL' | 'PROVISIONAL';
  timezone: string;
  dataAsOf: string;
};

export type OrderListPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type GrowthOrderPage = {
  meta: OrderListMeta;
  pagination: OrderListPagination;
  items: GrowthOrderRow[];
};

export const ORDER_STATUS_LABEL: Record<GrowthOrderStatus, string> = {
  PENDING_PROCESSING: 'Chờ xử lý',
  PREPARING_SHIPMENT: 'Chuẩn bị hàng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  NEEDS_RESOLUTION: 'Cần giải quyết',
};

export const ORDER_STATUS_OPTIONS: { value: GrowthOrderStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PROCESSING', label: ORDER_STATUS_LABEL.PENDING_PROCESSING },
  { value: 'PREPARING_SHIPMENT', label: ORDER_STATUS_LABEL.PREPARING_SHIPMENT },
  { value: 'COMPLETED', label: ORDER_STATUS_LABEL.COMPLETED },
  { value: 'CANCELLED', label: ORDER_STATUS_LABEL.CANCELLED },
  { value: 'NEEDS_RESOLUTION', label: ORDER_STATUS_LABEL.NEEDS_RESOLUTION },
];

export const BADGE_LABEL: Record<DiscountBadgeKind, string> = {
  SANH: 'Thẻ Sành',
  PRODUCT_DISCOUNT: 'Giảm giá SP',
  SELLER_VOUCHER: 'Voucher shop',
  PLATFORM_VOUCHER: 'Voucher sàn',
  SHIPPING_SUPPORT: 'Hỗ trợ ship',
};

/** "Thanh toán trước" chỉ khi NO_CASH; REFUND và null hiển thị riêng */
export function paymentLabel(
  method: PaymentMethod | null,
  status: PaymentStatus | null,
): string {
  if (!method) return '—';
  if (method === 'COD') return status === 'success' ? 'COD · đã thu' : 'COD';
  if (method === 'NO_CASH') return status === 'success' ? 'Thanh toán trước' : 'Chuyển khoản · chờ';
  return 'Hoàn tiền';
}

export const PAGE_SIZE_ORDER = [10, 20, 50, 100] as const;
export const PAGE_SIZE_ENTITY = [10, 20, 30] as const;

export type EmptyOrderPage = Page<GrowthOrderRow>;

/** Đổi response API 2 về Page<OrderRow> mà các page đang dùng. */
export function toOrderPage(page: GrowthOrderPage): Page<GrowthOrderRow> {
  return {
    items: page.items,
    total: page.pagination.totalItems,
    page: page.pagination.page,
    pageSize: page.pagination.pageSize,
  };
}
