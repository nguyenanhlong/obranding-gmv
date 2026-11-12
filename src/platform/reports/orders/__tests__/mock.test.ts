import { describe, expect, it } from 'vitest';
import { customers } from '@/platform/mock/dataset';
import { mockListGrowthOrders } from '../mock';

describe('mockListGrowthOrders', () => {
  it('scope PERIOD lọc theo groupBy + periodKey', () => {
    const page = mockListGrowthOrders({
      scope: 'PERIOD',
      groupBy: 'MONTH',
      periodKey: '2026-10',
      page: 1,
      pageSize: 10,
    });

    expect(page.meta.groupBy).toBe('MONTH');
    expect(page.pagination.pageSize).toBe(10);
    expect(page.items.length).toBeLessThanOrEqual(10);
    for (const order of page.items) {
      expect(order.placedAt.slice(0, 7)).toBe('2026-10');
    }
  });

  it('lọc status=CANCELLED chỉ trả đơn huỷ', () => {
    const page = mockListGrowthOrders({
      scope: 'SELLER',
      sellerId: 'seller-1',
      fromDate: '2025-11-01',
      toDate: '2026-10-27',
      status: 'CANCELLED',
      page: 1,
      pageSize: 20,
    });

    expect(page.items.every((row) => row.status === 'CANCELLED')).toBe(true);
    expect(page.pagination.pageSize).toBe(20);
  });

  it('pageSize ngoài bộ hợp đồng rơi về 10', () => {
    const page = mockListGrowthOrders({
      scope: 'CUSTOMER',
      customerId: 'customer-1',
      fromDate: '2025-11-01',
      toDate: '2026-10-27',
      page: 1,
      pageSize: 15,
    });

    expect(page.pagination.pageSize).toBe(10);
  });

  it('mốc nhà bán (bucket) thu hẹp khoảng ngày', () => {
    const page = mockListGrowthOrders({
      scope: 'SELLER',
      sellerId: 'seller-1',
      fromDate: '2025-11-01',
      toDate: '2026-10-27',
      bucketGroupBy: 'MONTH',
      bucketPeriodKey: '2026-10',
      page: 1,
      pageSize: 10,
    });

    expect(page.meta.bucketPeriodKey).toBe('2026-10');
    for (const order of page.items) {
      expect(order.placedAt.slice(0, 7)).toBe('2026-10');
    }
  });

  it('SELLER tìm được theo 4 số cuối điện thoại (q toàn số)', () => {
    const base = mockListGrowthOrders({
      scope: 'SELLER',
      sellerId: 'seller-1',
      fromDate: '2025-11-01',
      toDate: '2026-10-27',
      page: 1,
      pageSize: 10,
    });
    const first = base.items[0];
    expect(first).toBeDefined();

    const phone = customers().find((c) => c.id === first?.customerId)?.phone ?? '';
    const digits = phone.replace(/^\+?84/, '0').replace(/\D/g, '').slice(-4);
    expect(digits.length).toBe(4);

    const found = mockListGrowthOrders({
      scope: 'SELLER',
      sellerId: 'seller-1',
      fromDate: '2025-11-01',
      toDate: '2026-10-27',
      q: digits,
      page: 1,
      pageSize: 10,
    });

    expect(found.pagination.totalItems).toBeGreaterThan(0);
    expect(found.items.some((row) => row.customerId === first?.customerId)).toBe(true);
  });
});
