import { allOrders } from '@/platform/mock/dataset';
import type { OrderDetail, OrderSource, OrderTimelineStep } from '../contracts';

export const orderMockSource: OrderSource = {
  async get(publicId): Promise<OrderDetail | null> {
    const order = allOrders().find((o) => o.publicId === publicId);
    if (!order) return null;

    const totalDiscount = order.discounts.reduce((acc, d) => acc + d.amount, 0);

    const timeline: OrderTimelineStep[] = [
      { key: 'placed', label: 'Đặt hàng', at: order.placedAt, tone: 'done' },
      {
        key: 'confirmed',
        label: 'Xác nhận',
        at: order.confirmedAt,
        tone: order.confirmedAt ? 'done' : 'pending',
      },
      {
        key: 'packed',
        label: 'Đóng gói',
        at: order.packedAt,
        tone: order.packedAt ? 'done' : 'pending',
      },
      {
        key: 'shipped',
        label: 'Gửi hàng',
        at: order.shippedAt,
        tone: order.shippedAt ? 'done' : 'pending',
      },
      {
        key: 'delivered',
        label: 'Giao thành công',
        at: order.deliveredAt,
        tone: order.deliveredAt ? 'done' : 'pending',
      },
      ...(order.cancelledAt
        ? [
            {
              key: 'cancelled',
              label: 'Đã huỷ',
              at: order.cancelledAt,
              tone: 'danger' as const,
            },
          ]
        : []),
    ];

    return {
      order: {
        id: order.id,
        publicId: order.publicId,
        placedAt: order.placedAt,
        status: order.status,
        sellerId: order.sellerId,
        sellerCode: order.sellerCode,
        sellerName: order.sellerName,
        customerId: order.customerId,
        customerName: order.customerName,
        category: order.category,
        region: order.region,
        itemCount: order.itemCount,
        payment: order.payment,
        discounts: order.discounts,
        total: order.total,
      },
      product: {
        name: order.productName,
        sku: order.sku,
        unitPrice: order.unitPrice,
        quantity: order.itemCount,
      },
      subTotal: order.subTotal,
      shippingFee: order.shippingFee,
      totalDiscount,
      total: order.total,
      timeline,
    };
  },
};
