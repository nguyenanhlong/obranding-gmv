import { describe, expect, it } from 'vitest';
import { mapSellerSummary } from '../server/seller.mapper';
import type { RawSellerSummary } from '../server/seller.schema';

const raw: RawSellerSummary = {
  seller: {
    sellerId: '1191',
    sellerCode: 'SL0001191',
    sellerName: 'CÔNG TY TNHH GỐM LAM BÁT TRÀNG',
    mainCategory: 'Nhà cửa và Đời sống',
  },
  kpis: {
    orders: '2283',
    gmv: '1120456000',
    buyers: '1781',
    aov: '490782',
    completedOrders: '2009',
    completionRate: 88.0,
    ordersPerBuyer: 1.28,
  },
  series: {
    unit: 'DAY',
    buckets: [
      {
        key: '2026-07-01',
        label: '01/07/2026',
        shortLabel: '01/07',
        startDate: '2026-07-01',
        endDate: '2026-07-01',
        orders: '76',
        gmv: '37412000',
        buyers: '72',
      },
    ],
  },
};

describe('mapSellerSummary', () => {
  it('parse chuỗi số', () => {
    const s = mapSellerSummary(raw);
    expect(s.kpis.orders).toBe(2283);
    expect(s.kpis.gmv).toBe(1_120_456_000);
    expect(s.kpis.completedOrders).toBe(2009);
    expect(s.series.buckets[0]?.orders).toBe(76);
  });

  it('completionRate 88.0 (%) → 0.88', () => {
    expect(mapSellerSummary(raw).kpis.completionRate).toBeCloseTo(0.88, 5);
  });

  it('mainCategory null vẫn giữ null', () => {
    const s = mapSellerSummary({ ...raw, seller: { ...raw.seller, mainCategory: null } });
    expect(s.seller.mainCategory).toBeNull();
  });

  it('giữ unit và khoảng ngày của bucket', () => {
    const s = mapSellerSummary(raw);
    expect(s.series.unit).toBe('DAY');
    expect(s.series.buckets[0]).toMatchObject({
      startDate: '2026-07-01',
      endDate: '2026-07-01',
    });
  });
});
