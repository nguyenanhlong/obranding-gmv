import type { Money, OrderRow } from '@/contracts/base';

export type OrderTimelineStep = {
  key: string;
  label: string;
  at: string | null;
  /** mốc huỷ hoặc giao thành công — tô khác màu */
  tone?: 'done' | 'pending' | 'danger';
};

export type OrderDetail = {
  order: OrderRow;
  product: { name: string; sku: string; unitPrice: number; quantity: number };
  subTotal: number;
  shippingFee: number;
  totalDiscount: number;
  total: Money;
  timeline: OrderTimelineStep[];
};

/** Khớp endpoint GET /admin/orders/:publicId (đã có module order admin) */
export interface OrderSource {
  get(publicId: string): Promise<OrderDetail | null>;
}
