import { describe, expect, it } from 'vitest';
import type { GrowthPoint } from '../../contracts';
import { PROVISIONAL_LABEL, toGrowthBarData } from '../growth-bars.data';

const point = (p: Partial<GrowthPoint>): GrowthPoint => ({
  bucket: '2026-09',
  from: '2026-09-01',
  to: '2026-09-30',
  orders: 100,
  gmv: 50_000_000,
  buyers: 80,
  sellers: 10,
  growthPct: 0.125,
  isCurrent: false,
  ...p,
});

describe('toGrowthBarData', () => {
  it('kỳ đã chốt: nhãn là % tăng trưởng có dấu', () => {
    const [d] = toGrowthBarData([point({})], 'month');
    expect(d?.topLabel).toBe('+12,5%');
    expect(d?.axisLabel).toBe('T9/26');
  });

  it('kỳ đang diễn ra: nhãn "tạm tính" thay cho %', () => {
    const [d] = toGrowthBarData([point({ bucket: '2026-11', isCurrent: true, growthPct: -0.7 })], 'month');
    expect(d?.topLabel).toBe(PROVISIONAL_LABEL);
  });

  it('kỳ trước = 0 (growthPct null): không in nhãn, không in 0%', () => {
    const [d] = toGrowthBarData([point({ growthPct: null })], 'month');
    expect(d?.topLabel).toBe('');
  });

  it('giữ nguyên from/to để click cột vẫn mở đúng kỳ', () => {
    const [d] = toGrowthBarData([point({})], 'month');
    expect(d).toMatchObject({ from: '2026-09-01', to: '2026-09-30', gmv: 50_000_000, buyers: 80 });
  });
});