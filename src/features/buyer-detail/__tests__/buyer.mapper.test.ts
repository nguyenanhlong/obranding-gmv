import { describe, expect, it } from 'vitest';
import { mapBuyerSummary } from '../server/buyer.mapper';
import type { RawBuyerSummary } from '../server/buyer.schema';

const raw: RawBuyerSummary = {
  customer: {
    customerId: '11028',
    customerName: 'Vũ Thảo Nguyên',
    phoneMasked: '090****481',
    province: 'Thành phố Cần Thơ',
    buyerType: 'RETURNING',
  },
  kpis: {
    totalOrders: '19',
    validOrders: '16',
    cancelledOrders: '3',
    totalValue: '29184000',
    aov: '1824000',
    completedOrders: '13',
    completionRate: 68.4,
    sellersCount: '8',
    firstOrderAt: '2026-07-02T09:14:02+07:00',
    lastOrderAt: '2026-07-31T08:35:33+07:00',
  },
  series: {
    unit: 'DAY',
    buckets: [
      {
        key: '2026-07-02',
        label: '02/07/2026',
        shortLabel: '02/07',
        startDate: '2026-07-02',
        endDate: '2026-07-02',
        orders: '1',
        value: '2105000',
      },
    ],
  },
  topSellers: [
    {
      sellerId: '993',
      sellerCode: 'SL0000993',
      sellerName: 'MÂY TRE PHÚ VINH',
      orders: '8',
      value: '13412000',
    },
  ],
};

describe('mapBuyerSummary', () => {
  it('tách totalOrders / validOrders / cancelledOrders', () => {
    const s = mapBuyerSummary(raw);
    expect(s.kpis.totalOrders).toBe(19);
    expect(s.kpis.validOrders).toBe(16);
    expect(s.kpis.cancelledOrders).toBe(3);
  });

  it('completionRate 68.4 (%) → 0.684', () => {
    expect(mapBuyerSummary(raw).kpis.completionRate).toBeCloseTo(0.684, 5);
  });

  it('giữ buyerType và topSellers đã parse', () => {
    const s = mapBuyerSummary(raw);
    expect(s.customer.buyerType).toBe('RETURNING');
    expect(s.topSellers[0]).toMatchObject({ orders: 8, value: 13_412_000 });
  });

  it('phoneMasked / province null vẫn giữ null', () => {
    const s = mapBuyerSummary({
      ...raw,
      customer: { ...raw.customer, phoneMasked: null, province: null },
    });
    expect(s.customer.phoneMasked).toBeNull();
    expect(s.customer.province).toBeNull();
  });
});
