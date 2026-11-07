import { describe, expect, it } from 'vitest';
import { bucketOf, daysBetweenRange } from '@/platform/time';
import { activePresetKey, buildPresets, monthStart } from '../presets';

const today = '2026-11-07';
const byKey = (key: string) => buildPresets(today).find((p) => p.key === key)!;

describe('monthStart', () => {
  it('lùi qua năm', () => {
    expect(monthStart('2026-11-07', -11)).toBe('2025-12-01');
    expect(monthStart('2026-01-31', -1)).toBe('2025-12-01');
    expect(monthStart('2026-03-15', 0)).toBe('2026-03-01');
  });
});

describe('buildPresets', () => {
  it('12 tháng gần nhất: tròn tháng, đúng 12 bucket tháng', () => {
    const p = byKey('last12m');
    expect(p).toMatchObject({ from: '2025-12-01', to: today, period: 'month' });
    const buckets = new Set(daysBetweenRange(p.from, p.to).map((d) => bucketOf(d, 'month')));
    expect(buckets.size).toBe(12);
  });

  it('30 ngày gồm cả hôm nay', () => {
    expect(byKey('last30d')).toMatchObject({ from: '2026-10-09', to: today, period: 'day' });
    expect(daysBetweenRange(byKey('last30d').from, today)).toHaveLength(30);
  });

  it('năm nay / năm trước', () => {
    expect(byKey('thisYear')).toMatchObject({ from: '2026-01-01', to: today });
    expect(byKey('lastYear')).toMatchObject({ from: '2025-01-01', to: '2025-12-31' });
  });

  it('không preset nào có from > to', () => {
    for (const p of buildPresets('2026-01-01')) expect(p.from <= p.to).toBe(true);
  });
});

describe('activePresetKey', () => {
  it('khớp đủ from/to/period mới tô đậm', () => {
    const presets = buildPresets(today);
    expect(activePresetKey({ from: '2025-12-01', to: today, period: 'month' }, presets)).toBe('last12m');
    expect(activePresetKey({ from: '2025-12-01', to: today, period: 'week' }, presets)).toBeNull();
  });
});