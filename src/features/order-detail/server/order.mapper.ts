import { parseIntString } from '@/platform/reports/parse';
import type { OrderDrawerDetail } from '../contracts';
import type { RawOrderDrawer } from './order.schema';

/** Chỉ đổi kiểu dữ liệu (chuỗi → number), không cộng/trừ lại bất kỳ số tiền nào. */
export function mapOrderDrawer(raw: RawOrderDrawer): OrderDrawerDetail {
  return {
    orderPublicId: raw.orderPublicId,
    status: raw.status,
    state: raw.state ?? null,
    hasSanhBenefit: raw.hasSanhBenefit,
    customer: {
      customerId: raw.customer.customerId,
      customerName: raw.customer.customerName ?? null,
      maskedPhone: raw.customer.maskedPhone ?? null,
    },
    seller: {
      sellerId: raw.seller.sellerId,
      sellerCode: raw.seller.sellerCode ?? null,
      sellerName: raw.seller.sellerName ?? null,
    },
    regionName: raw.regionName ?? null,
    payment: {
      method: raw.payment.method ?? null,
      status: raw.payment.status ?? null,
    },
    placedAt: raw.placedAt,
    items: raw.items.map((item) => ({
      itemId: String(item.itemId),
      productName: item.productName,
      sku: item.sku ?? null,
      quantity: item.quantity,
      unitPriceVnd: parseIntString(item.unitPriceVnd),
      lineSubtotalVnd: parseIntString(item.lineSubtotalVnd),
    })),
    discountBreakdown: raw.discountBreakdown.map((discount) => ({
      kind: discount.kind,
      labelKey: discount.labelKey,
      amountVnd: parseIntString(discount.amountVnd),
      includedIn: discount.includedIn,
      fundedBy: discount.fundedBy,
      sellerFundedVnd:
        discount.sellerFundedVnd === null || discount.sellerFundedVnd === undefined
          ? null
          : parseIntString(discount.sellerFundedVnd),
      platformFundedVnd:
        discount.platformFundedVnd === null || discount.platformFundedVnd === undefined
          ? null
          : parseIntString(discount.platformFundedVnd),
    })),
    totals: {
      subtotalVnd: parseIntString(raw.totals.subtotalVnd),
      shippingFeeVnd: parseIntString(raw.totals.shippingFeeVnd),
      totalDiscountVnd: parseIntString(raw.totals.totalDiscountVnd),
      orderTotalVnd: parseIntString(raw.totals.orderTotalVnd),
    },
    delivery: {
      carrierName: raw.delivery.carrierName ?? null,
      trackingCode: raw.delivery.trackingCode ?? null,
      milestones: raw.delivery.milestones.map((milestone) => ({
        code: milestone.code,
        occurredAt: milestone.occurredAt ?? null,
        source: milestone.source ?? null,
      })),
      timelineIntegrity: raw.delivery.timelineIntegrity,
    },
    dataQualityFlags: raw.dataQualityFlags,
  };
}
