import { describe, expect, it } from 'vitest';
import { axisLabelOf, toGrowthLineData } from '../growth-line.data';
import type { GrowthPeriod } from '../../contracts';

describe('axisLabelOf', () => {
  it('định dạng nhãn trục theo groupBy', () => {
    expect(axisLabelOf('2026-09-01', 'DAY')).toBe('01/09');
    expect(axisLabelOf('2026-W44', 'WEEK')).toBe('W44/26');
    expect(axisLabelOf('2026-10', 'MONTH')).toBe('T10/26');
    expect(axisLabelOf('2026-Q4', 'QUARTER')).toBe('Q4/26');
    expect(axisLabelOf('2026', 'YEAR')).toBe('2026');
  });
});

function makePeriod(overrides: Partial<GrowthPeriod> = {}): GrowthPeriod {
  const metric = { value: 100, previousValue: 80, growthPercent: 0.25 };
  return {
    key: '2026-09',
    label: 'Tháng 9/2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'FINAL',
    orders: metric,
    buyers: { ...metric, value: 50 },
    gmv: { ...metric, value: 1_000_000 },
    activeSellers: { ...metric, value: 10 },
    aov: 10_000,
    topBuyersByOrders: [],
    topBuyersByValue: [],
    topSellersByOrders: [],
    ...overrides,
  };
}

describe('toGrowthLineData', () => {
  it('lấy đúng field theo chỉ số đang chọn', () => {
    const periods = [makePeriod()];
    expect(toGrowthLineData(periods, 'orders', 'MONTH')[0]?.value).toBe(100);
    expect(toGrowthLineData(periods, 'buyers', 'MONTH')[0]?.value).toBe(50);
    expect(toGrowthLineData(periods, 'gmv', 'MONTH')[0]?.value).toBe(1_000_000);
  });

  it('giữ nguyên khoảng ngày để drill-down và cờ trạng thái', () => {
    const periods = [makePeriod({ status: 'PROVISIONAL', key: '2026-11', startDate: '2026-11-01', endDate: '2026-11-30' })];
    const point = toGrowthLineData(periods, 'orders', 'MONTH')[0];
    expect(point).toMatchObject({
      axisLabel: 'T11/26',
      status: 'PROVISIONAL',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    });
  });
});
