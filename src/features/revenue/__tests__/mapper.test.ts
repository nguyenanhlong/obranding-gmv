import { describe, expect, it } from 'vitest';
import {
  deltaOf,
  mapMarketplace,
  mapSummary,
  mapTimeseries,
  toInt,
} from '../server/revenue.mapper';
import type { ReportFilters } from '@/platform/reports/filters';

const filters: ReportFilters = {
  from: '2026-10-01',
  to: '2026-10-30',
  granularity: 'day',
  compare: 'previous_period',
  marketplaces: [],
  tz: 'Asia/Ho_Chi_Minh',
};

describe('toInt', () => {
  it('nhận string số từ BE', () => {
    expect(toInt('1234567')).toBe(1234567);
    expect(toInt('1.234.567')).toBe(1234567);
  });

  it('an toàn với null và rác', () => {
    expect(toInt(null)).toBe(0);
    expect(toInt(undefined)).toBe(0);
    expect(toInt('không phải số')).toBe(0);
  });
});

describe('deltaOf', () => {
  it('kỳ trước bằng 0 thì pct null, không chia cho 0', () => {
    const d = deltaOf(100, 0);
    expect(d.pct).toBeNull();
    expect(d.direction).toBe('up');
  });

  it('không có kỳ so sánh thì flat', () => {
    const d = deltaOf(100, null);
    expect(d).toMatchObject({ value: 0, pct: null, direction: 'flat', compareTo: null });
  });

  it('tính đúng chiều giảm', () => {
    const d = deltaOf(80, 100);
    expect(d.direction).toBe('down');
    expect(d.pct).toBeCloseTo(-0.2);
  });
});

describe('mapSummary', () => {
  it('đổi string sang number và giữ nguyên range', () => {
    const s = mapSummary(
      {
        gmv: '900000000',
        order_count: '1875',
        gmv_per_day: '30000000',
        growth_rate: 0.12,
        compare_gmv: '750000000',
      },
      filters,
    );

    expect(s.gmv).toEqual({ amount: 900_000_000, currency: 'VND' });
    expect(s.orderCount).toBe(1875);
    expect(s.gmvDelta.direction).toBe('up');
    expect(s.range).toEqual({ from: '2026-10-01', to: '2026-10-30' });
  });

  it('không có compare_gmv thì pct null', () => {
    const s = mapSummary(
      {
        gmv: '1000',
        order_count: '1',
        gmv_per_day: '100',
        growth_rate: null,
        compare_gmv: null,
      },
      filters,
    );
    expect(s.gmvDelta.pct).toBeNull();
    expect(s.growthRate).toBeNull();
  });
});

describe('mapTimeseries', () => {
  it('gmv_prev null thì giữ null, không biến thành 0', () => {
    const p = mapTimeseries({
      bucket: '2026-10-01',
      gmv: '100',
      orders: 3,
      buyers: 2,
      gmv_prev: null,
    });
    expect(p.gmvPrev).toBeNull();
  });
});

describe('mapMarketplace', () => {
  it('tính share theo tổng', () => {
    const m = mapMarketplace({ id: 'shopee', name: 'Shopee', gmv: '250', prev_gmv: '200' }, 1000);
    expect(m.share).toBeCloseTo(0.25);
    expect(m.delta.direction).toBe('up');
  });

  it('tổng bằng 0 thì share = 0, không NaN', () => {
    const m = mapMarketplace({ id: 'shopee', name: 'Shopee', gmv: '0', prev_gmv: null }, 0);
    expect(m.share).toBe(0);
  });
});
