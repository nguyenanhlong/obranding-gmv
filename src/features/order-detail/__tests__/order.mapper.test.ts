import { describe, expect, it } from 'vitest';
import { mapOrderDrawer } from '../server/order.mapper';
import { orderDrawerSchema } from '../server/order.schema';

const raw = {
  orderPublicId: '26091202004582KQ7A',
  status: 'COMPLETED',
  state: 'SHIPPED',
  hasSanhBenefit: true,
  customer: {
    customerId: 'customer-1',
    customerName: 'Nguyễn Minh Anh',
    maskedPhone: '091****482',
  },
  seller: { sellerId: 'seller-1', sellerCode: 'SL0001201', sellerName: 'Cà phê Đất Đỏ' },
  regionName: 'Thành phố Hồ Chí Minh',
  payment: { method: 'COD', status: 'success' },
  placedAt: '2026-09-12T07:22:10.000Z',
  items: [
    {
      itemId: 42,
      productName: 'Bánh pía sầu riêng',
      sku: '1201-192',
      quantity: 1,
      unitPriceVnd: '827000',
      lineSubtotalVnd: '827000',
    },
  ],
  discountBreakdown: [
    {
      kind: 'SANH',
      labelKey: 'SANH_DISCOUNT',
      amountVnd: '61000',
      includedIn: 'PRODUCT',
      fundedBy: 'PLATFORM',
    },
    {
      kind: 'SHIPPING_SUPPORT',
      labelKey: 'SHIP_SUPPORT',
      amountVnd: '20000',
      includedIn: 'SHIPPING',
      fundedBy: 'MIXED',
      sellerFundedVnd: '10000',
      platformFundedVnd: '10000',
    },
  ],
  totals: {
    subtotalVnd: '827000',
    shippingFeeVnd: '25000',
    totalDiscountVnd: '81000',
    orderTotalVnd: '771000',
  },
  delivery: {
    carrierName: 'Viettel Post',
    trackingCode: null,
    timelineIntegrity: 'INCOMPLETE',
    milestones: [
      { code: 'PLACED', occurredAt: '2026-09-12T07:22:10Z', source: 'ORDER' },
      { code: 'PACKED', occurredAt: null, source: null },
    ],
  },
  dataQualityFlags: ['PACKED_TIMESTAMP_UNAVAILABLE'],
};

describe('orderDrawerSchema + mapOrderDrawer', () => {
  it('đổi tiền chuỗi sang number, giữ nguyên cờ và mốc null', () => {
    const detail = mapOrderDrawer(orderDrawerSchema.parse(raw));

    expect(detail.orderPublicId).toBe('26091202004582KQ7A');
    expect(detail.items[0]?.unitPriceVnd).toBe(827_000);
    expect(detail.items[0]?.itemId).toBe('42');
    expect(detail.totals.orderTotalVnd).toBe(771_000);
    expect(detail.totals.totalDiscountVnd).toBe(81_000);
    expect(detail.delivery.milestones[1]).toEqual({
      code: 'PACKED',
      occurredAt: null,
      source: null,
    });
    expect(detail.dataQualityFlags).toEqual(['PACKED_TIMESTAMP_UNAVAILABLE']);
  });

  it('không cộng lại totalDiscount: dùng đúng số BE trả', () => {
    const detail = mapOrderDrawer(orderDrawerSchema.parse(raw));
    const sumRows = detail.discountBreakdown.reduce((sum, d) => sum + d.amountVnd, 0);
    // 61.000 + 20.000 = 81.000, nhưng nếu BE trả khác thì vẫn giữ số BE
    expect(sumRows).toBe(81_000);
    const tampered = mapOrderDrawer(
      orderDrawerSchema.parse({ ...raw, totals: { ...raw.totals, totalDiscountVnd: '999000' } }),
    );
    expect(tampered.totals.totalDiscountVnd).toBe(999_000);
  });

  it('chấp nhận seller/customer/payment null và mảng rỗng', () => {
    const detail = mapOrderDrawer(
      orderDrawerSchema.parse({
        ...raw,
        state: null,
        customer: { customerId: 'customer-2', customerName: null, maskedPhone: null },
        seller: { sellerId: 'seller-2', sellerCode: null, sellerName: null },
        regionName: null,
        payment: { method: null, status: null },
        discountBreakdown: [],
        dataQualityFlags: [],
        delivery: { ...raw.delivery, carrierName: null, milestones: [] },
      }),
    );

    expect(detail.customer.maskedPhone).toBeNull();
    expect(detail.seller.sellerCode).toBeNull();
    expect(detail.payment.method).toBeNull();
    expect(detail.discountBreakdown).toEqual([]);
    expect(detail.delivery.milestones).toEqual([]);
  });
});
