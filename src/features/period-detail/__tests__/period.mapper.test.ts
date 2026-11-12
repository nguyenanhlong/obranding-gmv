import { describe, expect, it } from 'vitest';
import { mapPeriodSummary } from '../server/period.mapper';
import type { RawPeriodSummary } from '../server/period.schema';

const raw: RawPeriodSummary = {
  period: {
    periodKey: '2026-10-25',
    periodLabel: '25/10/2026',
    groupBy: 'DAY',
    startDate: '2026-10-25',
    endDate: '2026-10-25',
    status: 'FINAL',
  },
  kpis: {
    orders: { value: '3605', previousValue: '3160', growthPercent: 14.1 },
    gmv: { value: '1575385000', previousValue: '1320525000', growthPercent: 19.3 },
    buyers: { value: '3431', previousValue: '2973', growthPercent: 15.4 },
    activeSellers: { value: '446', previousValue: '462', growthPercent: -3.5 },
    aov: '437000',
    newBuyers: '1338',
    newBuyerRate: 39.0,
  },
  distribution: {
    unit: 'HOUR',
    buckets: [
      { key: '20', label: '20h–21h', shortLabel: '20h', orders: '283', isFuture: false },
      { key: '21', label: '21h–22h', shortLabel: '21h', orders: '0', isFuture: true },
    ],
    peak: { key: '20', label: '20h–21h', shortLabel: '20h', orders: '283', isFuture: false },
  },
};

describe('mapPeriodSummary', () => {
  it('parse chuỗi số và đổi % về 0..1', () => {
    const s = mapPeriodSummary(raw);
    expect(s.kpis.orders.value).toBe(3605);
    expect(s.kpis.orders.growthPercent).toBeCloseTo(0.141, 5);
    expect(s.kpis.activeSellers.growthPercent).toBeCloseTo(-0.035, 5);
    expect(s.kpis.aov).toBe(437_000);
    expect(s.kpis.newBuyers).toBe(1338);
  });

  it('newBuyerRate 39.0 (%) → 0.39', () => {
    expect(mapPeriodSummary(raw).kpis.newBuyerRate).toBeCloseTo(0.39, 5);
  });

  it('giữ unit, isFuture và peak của distribution', () => {
    const s = mapPeriodSummary(raw);
    expect(s.distribution.unit).toBe('HOUR');
    expect(s.distribution.buckets[1]).toMatchObject({ orders: 0, isFuture: true });
    expect(s.distribution.peak?.orders).toBe(283);
  });

  it('peak null vẫn giữ null', () => {
    const s = mapPeriodSummary({ ...raw, distribution: { ...raw.distribution, peak: null } });
    expect(s.distribution.peak).toBeNull();
  });
});
