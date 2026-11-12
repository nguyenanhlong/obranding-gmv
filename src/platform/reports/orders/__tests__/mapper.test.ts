import { describe, expect, it } from 'vitest';
import { mapOrderItem, mapOrderList } from '../mapper';
import { orderListSchema } from '../schema';
import { paymentLabel, toOrderPage } from '../contracts';

const rawItem = {
  orderPublicId: 'GOM-0001',
  orderNumber: 'OD-0001',
  placedAt: '2026-10-05T03:15:00.000Z',
  sellerId: 'seller-1',
  sellerCode: 'S1',
  sellerName: 'Nhà bán 1',
  customerId: 'customer-1',
  customerName: 'Khách 1',
  primaryCategoryName: 'Thời trang',
  itemQuantity: 2,
  regionName: 'Hà Nội',
  orderTotalVnd: '1.250.000',
  discountBadges: ['SANH', 'SHIPPING_SUPPORT'],
  paymentMethod: 'COD',
  paymentStatus: 'success',
  status: 'COMPLETED',
  sourceStatus: 'DELIVERED',
  state: 'DONE',
};

describe('mapOrderItem', () => {
  it('đổi chuỗi tiền VND sang number, giữ nguyên badge và trạng thái', () => {
    const row = mapOrderItem({
      ...rawItem,
      discountBadges: ['SANH', 'SHIPPING_SUPPORT'],
    } as never);

    expect(row.orderTotalVnd).toBe(1_250_000);
    expect(row.discountBadges).toEqual(['SANH', 'SHIPPING_SUPPORT']);
    expect(row.status).toBe('COMPLETED');
    expect(row.placedAt).toBe('2026-10-05T03:15:00.000Z');
  });

  it('null hoá seller/customer/payment khi BE trả thiếu', () => {
    const row = mapOrderItem({
      ...rawItem,
      sellerId: null,
      sellerCode: null,
      sellerName: null,
      customerId: null,
      customerName: null,
      primaryCategoryName: null,
      regionName: null,
      paymentMethod: null,
      paymentStatus: null,
      state: null,
    } as never);

    expect(row.sellerId).toBeNull();
    expect(row.customerName).toBeNull();
    expect(row.paymentMethod).toBeNull();
    expect(row.state).toBeNull();
  });
});

describe('mapOrderList', () => {
  it('map meta + pagination + items', () => {
    const raw = {
      meta: {
        scope: 'PERIOD',
        groupBy: 'MONTH',
        periodKey: '2026-10',
        customerId: null,
        sellerId: null,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        listStartDate: '2026-10-01',
        listEndDate: '2026-10-27',
        bucketGroupBy: null,
        bucketPeriodKey: null,
        periodStatus: 'PROVISIONAL',
        timezone: 'Asia/Ho_Chi_Minh',
        dataAsOf: '2026-10-27T07:45:00.000Z',
      },
      pagination: { page: 2, pageSize: 20, totalItems: 45, totalPages: 3 },
      items: [rawItem],
    };

    const page = mapOrderList(orderListSchema.parse(raw));
    expect(page.meta.periodStatus).toBe('PROVISIONAL');
    expect(page.pagination.totalItems).toBe(45);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.orderTotalVnd).toBe(1_250_000);
  });

  it('schema chấp nhận thiếu field nullable và mặc định badge rỗng', () => {
    const parsed = orderListSchema.parse({
      meta: {
        scope: 'SELLER',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        listStartDate: '2026-10-01',
        listEndDate: '2026-10-27',
        periodStatus: 'FINAL',
        timezone: 'Asia/Ho_Chi_Minh',
        dataAsOf: '2026-10-27T07:45:00.000Z',
      },
      pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
      items: [
        {
          ...rawItem,
          sellerId: undefined,
          discountBadges: undefined,
          paymentMethod: undefined,
        },
      ],
    });

    expect(parsed.meta.groupBy).toBeNull();
    expect(parsed.items[0]?.discountBadges).toEqual([]);
    expect(mapOrderItem(parsed.items[0] as never).sellerId).toBeNull();
  });
});

describe('paymentLabel', () => {
  it('chỉ NO_CASH mới là "Thanh toán trước"', () => {
    expect(paymentLabel('NO_CASH', 'success')).toBe('Thanh toán trước');
    expect(paymentLabel('COD', 'success')).toBe('COD · đã thu');
    expect(paymentLabel('COD', 'waiting')).toBe('COD');
    expect(paymentLabel('REFUND', null)).toBe('Hoàn tiền');
    expect(paymentLabel(null, null)).toBe('—');
  });
});

describe('toOrderPage', () => {
  it('total lấy từ pagination.totalItems', () => {
    const page = toOrderPage({
      meta: {
        scope: 'PERIOD',
        groupBy: null,
        periodKey: null,
        customerId: null,
        sellerId: null,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        listStartDate: '2026-10-01',
        listEndDate: '2026-10-27',
        bucketGroupBy: null,
        bucketPeriodKey: null,
        periodStatus: 'FINAL',
        timezone: 'Asia/Ho_Chi_Minh',
        dataAsOf: '2026-10-27T07:45:00.000Z',
      },
      pagination: { page: 1, pageSize: 10, totalItems: 7, totalPages: 1 },
      items: [],
    });

    expect(page.total).toBe(7);
    expect(page.pageSize).toBe(10);
  });
});
