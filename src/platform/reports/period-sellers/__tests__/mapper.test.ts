import { describe, expect, it } from 'vitest';
import { mockListPeriodSellers } from '../mock';
import { mapPeriodSeller, mapPeriodSellerList } from '../mapper';
import { periodSellerListSchema } from '../schema';

const raw = {
  sellerId: 'seller-1',
  sellerCode: 'SL0000001',
  sellerName: 'Nhà bán 1',
  primaryCategoryName: 'Thời trang',
  orderCount: '12',
  gmvVnd: '9.800.000',
  buyerCount: '7',
  gmvSharePercent: 12.5,
} as const;

describe('mapPeriodSeller', () => {
  it('đổi chuỗi số sang number, giữ % đã ×100', () => {
    const row = mapPeriodSeller(raw as never);
    expect(row.orderCount).toBe(12);
    expect(row.gmvVnd).toBe(9_800_000);
    expect(row.buyerCount).toBe(7);
    expect(row.gmvSharePercent).toBe(12.5);
  });

  it('gmvSharePercent null khi BE không tính được', () => {
    const row = mapPeriodSeller({ ...raw, gmvSharePercent: null } as never);
    expect(row.gmvSharePercent).toBeNull();
  });
});

describe('mapPeriodSellerList', () => {
  it('map pagination.totalItems', () => {
    const parsed = periodSellerListSchema.parse({
      meta: {
        groupBy: 'MONTH',
        periodKey: '2026-09',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        periodStatus: 'FINAL',
        timezone: 'Asia/Ho_Chi_Minh',
        dataAsOf: '2026-10-27T07:45:00.000Z',
      },
      pagination: { page: 1, pageSize: 10, totalItems: 2, totalPages: 1 },
      items: [raw],
    });

    const page = mapPeriodSellerList(parsed);
    expect(page.pagination.totalItems).toBe(2);
    expect(page.items[0]?.sellerId).toBe('seller-1');
  });
});

describe('mockListPeriodSellers', () => {
  it('xếp cố định theo GMV giảm dần, tỷ trọng trong 0..100', () => {
    const page = mockListPeriodSellers({
      groupBy: 'MONTH',
      periodKey: '2026-09',
      page: 1,
      pageSize: 10,
    });

    expect(page.items.length).toBeGreaterThan(0);
    for (let i = 1; i < page.items.length; i += 1) {
      expect(Number(page.items[i - 1]?.gmvVnd)).toBeGreaterThanOrEqual(
        Number(page.items[i]?.gmvVnd),
      );
    }
    for (const row of page.items) {
      expect(row.gmvSharePercent).not.toBeNull();
      expect(row.gmvSharePercent as number).toBeGreaterThanOrEqual(0);
      expect(row.gmvSharePercent as number).toBeLessThanOrEqual(100);
    }
  });

  it('tìm theo mã nhà bán (prefix) và giữ totalItems sau lọc', () => {
    const all = mockListPeriodSellers({
      groupBy: 'MONTH',
      periodKey: '2026-09',
      page: 1,
      pageSize: 10,
    });
    const first = all.items[0];
    expect(first).toBeDefined();

    const filtered = mockListPeriodSellers({
      groupBy: 'MONTH',
      periodKey: '2026-09',
      q: (first?.sellerCode ?? '').slice(0, 4),
      page: 1,
      pageSize: 10,
    });

    expect(filtered.pagination.totalItems).toBeLessThanOrEqual(all.pagination.totalItems);
    expect(filtered.pagination.totalItems).toBeGreaterThan(0);
  });
});
