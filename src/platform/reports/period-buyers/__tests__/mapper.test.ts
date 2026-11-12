import { describe, expect, it } from 'vitest';
import { maskPhone, mockListPeriodBuyers } from '../mock';
import { mapPeriodBuyer, mapPeriodBuyerList } from '../mapper';
import { periodBuyerListSchema } from '../schema';

const raw = {
  customerId: 'customer-1',
  customerName: 'Khách 1',
  maskedPhone: '095****964',
  orderCount: '3',
  totalValueVnd: '2.500.000',
  aovVnd: '833333',
  regionName: 'Hà Nội',
  classification: 'NEW',
  lastOrderAt: '2026-09-30T10:00:00.000Z',
} as const;

describe('mapPeriodBuyer', () => {
  it('đổi chuỗi số sang number', () => {
    const row = mapPeriodBuyer(raw as never);
    expect(row.orderCount).toBe(3);
    expect(row.totalValueVnd).toBe(2_500_000);
    expect(row.aovVnd).toBe(833_333);
    expect(row.classification).toBe('NEW');
  });

  it('giữ null cho phone/khu vực', () => {
    const row = mapPeriodBuyer({ ...raw, maskedPhone: null, regionName: null } as never);
    expect(row.maskedPhone).toBeNull();
    expect(row.regionName).toBeNull();
  });
});

describe('mapPeriodBuyerList', () => {
  it('map meta.sortBy và pagination', () => {
    const parsed = periodBuyerListSchema.parse({
      meta: {
        groupBy: 'MONTH',
        periodKey: '2026-09',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        periodStatus: 'FINAL',
        timezone: 'Asia/Ho_Chi_Minh',
        dataAsOf: '2026-10-27T07:45:00.000Z',
        sortBy: 'TOTAL_VALUE',
      },
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      items: [raw],
    });

    const page = mapPeriodBuyerList(parsed);
    expect(page.meta.sortBy).toBe('TOTAL_VALUE');
    expect(page.items[0]?.totalValueVnd).toBe(2_500_000);
  });
});

describe('maskPhone', () => {
  it('3 số đầu + **** + 3 số cuối', () => {
    expect(maskPhone('0951234964')).toBe('095****964');
    expect(maskPhone('+84951234964')).toBe('095****964');
  });

  it('số ngắn chỉ giữ tối đa 2 số cuối', () => {
    expect(maskPhone('123456')).toBe('****56');
    expect(maskPhone(null)).toBeNull();
  });
});

describe('mockListPeriodBuyers', () => {
  it('xếp theo ORDER_COUNT mặc định, có badge tổng', () => {
    const page = mockListPeriodBuyers({
      groupBy: 'MONTH',
      periodKey: '2026-09',
      page: 1,
      pageSize: 10,
    });

    expect(page.meta.sortBy).toBe('ORDER_COUNT');
    expect(page.items.length).toBeLessThanOrEqual(10);
    expect(page.pagination.totalItems).toBeGreaterThan(0);
    for (let i = 1; i < page.items.length; i += 1) {
      expect(Number(page.items[i - 1]?.orderCount)).toBeGreaterThanOrEqual(
        Number(page.items[i]?.orderCount),
      );
    }
  });

  it('TOTAL_VALUE xếp theo tổng giá trị', () => {
    const page = mockListPeriodBuyers({
      groupBy: 'MONTH',
      periodKey: '2026-09',
      sortBy: 'TOTAL_VALUE',
      page: 1,
      pageSize: 10,
    });

    expect(page.meta.sortBy).toBe('TOTAL_VALUE');
    for (let i = 1; i < page.items.length; i += 1) {
      expect(Number(page.items[i - 1]?.totalValueVnd)).toBeGreaterThanOrEqual(
        Number(page.items[i]?.totalValueVnd),
      );
    }
  });

  it('pageSize ngoài 10/20/30 rơi về 10', () => {
    const page = mockListPeriodBuyers({
      groupBy: 'MONTH',
      periodKey: '2026-09',
      page: 1,
      pageSize: 50,
    });
    expect(page.pagination.pageSize).toBe(10);
  });
});
