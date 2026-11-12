import { allOrders, customers, type MockOrder } from '@/platform/mock/dataset';
import { maskPhone } from '@/platform/format/phone';
import type { GrowthOrderStatus } from '@/platform/reports/orders/contracts';
import type { MilestoneCode, OrderSource } from '../contracts';
import { mapOrderDrawer } from './order.mapper';
import { orderDrawerSchema, type RawOrderDrawer } from './order.schema';

const STATUS_MAP: Record<string, GrowthOrderStatus> = {
  PENDING: 'PENDING_PROCESSING',
  PREPARING: 'PREPARING_SHIPMENT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NEEDS_RESOLUTION: 'NEEDS_RESOLUTION',
};

const DISCOUNT_META: Record<
  string,
  {
    kind: RawOrderDrawer['discountBreakdown'][number]['kind'];
    labelKey: string;
    includedIn: RawOrderDrawer['discountBreakdown'][number]['includedIn'];
    fundedBy: RawOrderDrawer['discountBreakdown'][number]['fundedBy'];
  }
> = {
  'Thẻ Sành': {
    kind: 'SANH',
    labelKey: 'SANH_DISCOUNT',
    includedIn: 'PRODUCT',
    fundedBy: 'PLATFORM',
  },
  'Giảm giá SP': {
    kind: 'PRODUCT_DISCOUNT',
    labelKey: 'PRODUCT_DISCOUNT',
    includedIn: 'PRODUCT',
    fundedBy: 'PLATFORM',
  },
  'Voucher shop': {
    kind: 'SELLER_VOUCHER',
    labelKey: 'SHOP_VOUCHER',
    includedIn: 'SELLER',
    fundedBy: 'SELLER',
  },
  'Voucher sàn': {
    kind: 'PLATFORM_VOUCHER',
    labelKey: 'PLATFORM_VOUCHER',
    includedIn: 'PLATFORM',
    fundedBy: 'PLATFORM',
  },
  'Hỗ trợ ship': {
    kind: 'SHIPPING_SUPPORT',
    labelKey: 'SHIP_SUPPORT',
    includedIn: 'SHIPPING',
    fundedBy: 'MIXED',
  },
};

const MILESTONE_ORDER: MilestoneCode[] = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

function buildRawDrawer(order: MockOrder): RawOrderDrawer {
  const phone = customers().find((c) => c.id === order.customerId)?.phone ?? null;

  const discounts = order.discounts
    .filter((d) => d.amount > 0)
    .map((d) => {
      const meta = DISCOUNT_META[d.label];
      return {
        kind: meta?.kind ?? 'PRODUCT_DISCOUNT',
        labelKey: meta?.labelKey ?? 'PRODUCT_DISCOUNT',
        amountVnd: String(d.amount),
        includedIn: meta?.includedIn ?? 'PRODUCT',
        fundedBy: meta?.fundedBy ?? 'UNKNOWN',
        sellerFundedVnd: null,
        platformFundedVnd: null,
      };
    });

  // Tổng ưu đãi theo hợp đồng = product + seller + platform + shipping.
  const totalDiscount = order.discounts.reduce((sum, d) => sum + d.amount, 0);

  // PACKED không có nguồn độc lập (packed_at của mock là bản sao confirmed_at) → luôn null.
  const milestones: RawOrderDrawer['delivery']['milestones'] = [
    { code: 'PLACED', occurredAt: order.placedAt, source: 'ORDER' },
    { code: 'CONFIRMED', occurredAt: order.confirmedAt, source: order.confirmedAt ? 'ORDER' : null },
    { code: 'PACKED', occurredAt: null, source: null },
    { code: 'SHIPPED', occurredAt: order.shippedAt, source: order.shippedAt ? 'ORDER' : null },
    {
      code: 'DELIVERED',
      occurredAt: order.deliveredAt,
      source: order.deliveredAt ? 'ORDER' : null,
    },
  ];
  if (order.cancelledAt) {
    milestones.push({ code: 'CANCELLED', occurredAt: order.cancelledAt, source: 'ORDER' });
  }

  // Kiểm tra thứ tự thật của các mốc đã có thời gian.
  const ordered = milestones.filter(
    (m) => m.occurredAt !== null && MILESTONE_ORDER.includes(m.code),
  );
  let outOfOrder = false;
  for (let i = 1; i < ordered.length; i += 1) {
    if ((ordered[i - 1]?.occurredAt ?? '') > (ordered[i]?.occurredAt ?? '')) outOfOrder = true;
  }
  const missing = milestones.some((m) => m.occurredAt === null && MILESTONE_ORDER.includes(m.code));
  const timelineIntegrity = outOfOrder ? 'OUT_OF_ORDER' : missing ? 'INCOMPLETE' : 'OK';

  const flags: RawOrderDrawer['dataQualityFlags'] = [];
  if (order.subTotal + order.shippingFee - totalDiscount !== order.total.amount) {
    flags.push('MONEY_MISMATCH');
  }
  flags.push('PACKED_TIMESTAMP_UNAVAILABLE');
  if (outOfOrder) flags.push('TIMELINE_OUT_OF_ORDER');
  if ((order.shippedAt || order.deliveredAt) && !order.deliveredAt) {
    flags.push('SHIPMENT_PARTIAL');
  }

  return {
    orderPublicId: order.publicId,
    status: STATUS_MAP[order.status] ?? 'COMPLETED',
    state: order.status,
    hasSanhBenefit: order.discounts.some((d) => d.label === 'Thẻ Sành' && d.amount > 0),
    customer: {
      customerId: order.customerId,
      customerName: order.customerName,
      maskedPhone: maskPhone(phone),
    },
    seller: {
      sellerId: order.sellerId,
      sellerCode: order.sellerCode,
      sellerName: order.sellerName,
    },
    regionName: order.region,
    payment: {
      method: order.payment === 'COD' ? 'COD' : 'NO_CASH',
      status:
        order.status === 'CANCELLED'
          ? 'failed'
          : order.status === 'COMPLETED'
            ? 'success'
            : 'waiting',
    },
    placedAt: new Date(order.placedAt).toISOString(),
    items: [
      {
        itemId: order.id,
        productName: order.productName,
        sku: order.sku,
        quantity: order.itemCount,
        unitPriceVnd: String(order.unitPrice),
        lineSubtotalVnd: String(order.subTotal),
      },
    ],
    discountBreakdown: discounts,
    totals: {
      subtotalVnd: String(order.subTotal),
      shippingFeeVnd: String(order.shippingFee),
      totalDiscountVnd: String(totalDiscount),
      orderTotalVnd: String(order.total.amount),
    },
    delivery: {
      carrierName: null,
      trackingCode: null,
      milestones,
      timelineIntegrity,
    },
    dataQualityFlags: flags,
  };
}

export const orderMockSource: OrderSource = {
  async get(publicId) {
    const order = allOrders().find((o) => o.publicId === publicId);
    if (!order) return null;
    return mapOrderDrawer(orderDrawerSchema.parse(buildRawDrawer(order)));
  },
};
