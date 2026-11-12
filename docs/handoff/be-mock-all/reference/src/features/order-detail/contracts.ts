import type { GrowthOrderStatus, PaymentMethod, PaymentStatus } from '@/platform/reports/orders/contracts';

export type DrawerDiscountKind =
  | 'SANH'
  | 'PRODUCT_DISCOUNT'
  | 'SELLER_VOUCHER'
  | 'PLATFORM_VOUCHER'
  | 'SHIPPING_SUPPORT';

/** Ưu đãi này nằm trong tầng nào của tổng tiền */
export type DiscountIncludedIn = 'PRODUCT' | 'SELLER' | 'PLATFORM' | 'SHIPPING';
export type DiscountFundedBy = 'PLATFORM' | 'SELLER' | 'MIXED' | 'UNKNOWN';

export type DrawerItem = {
  itemId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPriceVnd: number;
  /** tiền hàng trước ưu đãi của dòng */
  lineSubtotalVnd: number;
};

export type DrawerDiscount = {
  kind: DrawerDiscountKind;
  labelKey: string;
  /** luôn dương; UI hiển thị dấu trừ */
  amountVnd: number;
  includedIn: DiscountIncludedIn;
  fundedBy: DiscountFundedBy;
  sellerFundedVnd: number | null;
  platformFundedVnd: number | null;
};

export type MilestoneCode =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type MilestoneSource = 'ORDER' | 'FULFILLMENT' | 'SHIPMENT_EVENT' | null;

export type DeliveryMilestone = {
  code: MilestoneCode;
  /** null = chưa có thời gian thật, không vẽ như đã xong */
  occurredAt: string | null;
  source: MilestoneSource;
};

export type TimelineIntegrity = 'OK' | 'INCOMPLETE' | 'OUT_OF_ORDER';

export type DrawerDelivery = {
  carrierName: string | null;
  trackingCode: string | null;
  milestones: DeliveryMilestone[];
  timelineIntegrity: TimelineIntegrity;
};

export type DrawerTotals = {
  subtotalVnd: number;
  shippingFeeVnd: number;
  /** tổng ưu đãi BE trả — không tự cộng lại */
  totalDiscountVnd: number;
  orderTotalVnd: number;
};

export type DataQualityFlag =
  | 'MONEY_MISMATCH'
  | 'DISCOUNT_MISMATCH'
  | 'UNVERIFIED_LEGACY_DISCOUNT'
  | 'PACKED_TIMESTAMP_UNAVAILABLE'
  | 'SHIPMENT_PARTIAL'
  | 'TIMELINE_OUT_OF_ORDER';

/** Projection của GET /admin/orders/:publicId?view=growthDrawer */
export type OrderDrawerDetail = {
  orderPublicId: string;
  status: GrowthOrderStatus;
  state: string | null;
  hasSanhBenefit: boolean;
  customer: {
    customerId: string;
    customerName: string | null;
    maskedPhone: string | null;
  };
  seller: {
    sellerId: string;
    sellerCode: string | null;
    sellerName: string | null;
  };
  regionName: string | null;
  payment: { method: PaymentMethod | null; status: PaymentStatus | null };
  placedAt: string;
  items: DrawerItem[];
  discountBreakdown: DrawerDiscount[];
  totals: DrawerTotals;
  delivery: DrawerDelivery;
  dataQualityFlags: DataQualityFlag[];
};

export interface OrderSource {
  get(publicId: string): Promise<OrderDrawerDetail | null>;
}

export const MILESTONE_LABEL: Record<MilestoneCode, string> = {
  PLACED: 'Đặt hàng',
  CONFIRMED: 'Xác nhận',
  PACKED: 'Đóng gói',
  SHIPPED: 'Gửi hàng',
  DELIVERED: 'Giao thành công',
  CANCELLED: 'Đã huỷ',
  RETURNED: 'Hoàn trả',
};

export const DISCOUNT_LABEL: Record<DrawerDiscountKind, string> = {
  SANH: 'Ưu đãi Thẻ Sành',
  PRODUCT_DISCOUNT: 'Giảm giá sản phẩm',
  SELLER_VOUCHER: 'Voucher nhà bán',
  PLATFORM_VOUCHER: 'Voucher sàn',
  SHIPPING_SUPPORT: 'Hỗ trợ vận chuyển',
};

export const FUNDED_BY_LABEL: Record<DiscountFundedBy, string> = {
  PLATFORM: 'Sàn tài trợ',
  SELLER: 'Nhà bán tài trợ',
  MIXED: 'Đồng tài trợ',
  UNKNOWN: 'Chưa rõ nguồn',
};

export const DATA_QUALITY_LABEL: Record<DataQualityFlag, string> = {
  MONEY_MISMATCH: 'Số tiền không khớp snapshot — giữ nguyên số BE trả',
  DISCOUNT_MISMATCH: 'Ưu đãi lệch so với snapshot',
  UNVERIFIED_LEGACY_DISCOUNT: 'Ưu đãi cũ chưa được xác minh',
  PACKED_TIMESTAMP_UNAVAILABLE: 'Chưa có mốc đóng gói độc lập',
  SHIPMENT_PARTIAL: 'Thiếu một phần dữ liệu vận chuyển',
  TIMELINE_OUT_OF_ORDER: 'Các mốc thời gian không đúng thứ tự',
};

export const TIMELINE_INTEGRITY_LABEL: Record<TimelineIntegrity, string> = {
  OK: 'Đủ mốc',
  INCOMPLETE: 'Thiếu mốc',
  OUT_OF_ORDER: 'Sai thứ tự mốc',
};
