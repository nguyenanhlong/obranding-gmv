import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RANGE_DAYS,
  FilterError,
  MAX_RANGE_DAYS,
  comparisonRange,
  daysBetween,
  filtersToQueryString,
  parseFilters,
  shiftDays,
  todayIn,
} from '../filters';

describe('parseFilters', () => {
  it('không có tham số thì mặc định 30 ngày gần nhất', () => {
    const f = parseFilters({});
    expect(daysBetween(f.from, f.to)).toBe(DEFAULT_RANGE_DAYS);
    expect(f.to).toBe(todayIn());
    expect(f.granularity).toBe('day');
    expect(f.compare).toBe('previous_period');
    expect(f.marketplaces).toEqual([]);
  });

  it('nhận marketplaces dạng CSV và khử trùng lặp', () => {
    const f = parseFilters({ marketplaces: 'shopee, tiktok ,shopee' });
    expect(f.marketplaces).toEqual(['shopee', 'tiktok']);
  });

  it('nhận marketplaces dạng repeated param', () => {
    const f = parseFilters({ marketplaces: ['lazada', 'tiki'] });
    expect(f.marketplaces).toEqual(['lazada', 'tiki']);
  });

  it('granularity lạ thì rơi về day, không nổ', () => {
    const f = parseFilters({ granularity: 'quarter' });
    expect(f.granularity).toBe('day');
  });

  it('from > to thì ném FilterError', () => {
    expect(() => parseFilters({ from: '2026-11-10', to: '2026-11-01' })).toThrow(FilterError);
  });

  it('vượt quá số ngày tối đa thì ném FilterError', () => {
    const from = '2026-01-01';
    const to = shiftDays(from, MAX_RANGE_DAYS + 1);
    expect(() => parseFilters({ from, to })).toThrow(FilterError);
  });

  it('ngày sai định dạng thì ném lỗi', () => {
    expect(() => parseFilters({ from: '01/11/2026' })).toThrow();
  });
});

describe('comparisonRange', () => {
  const base = parseFilters({ from: '2026-10-01', to: '2026-10-10' });

  it('previous_period lùi đúng độ dài kỳ', () => {
    expect(comparisonRange(base)).toEqual({ from: '2026-09-21', to: '2026-09-30' });
  });

  it('previous_year lùi 365 ngày', () => {
    expect(comparisonRange({ ...base, compare: 'previous_year' })).toEqual({
      from: '2025-10-01',
      to: '2025-10-10',
    });
  });

  it('none thì không có kỳ so sánh', () => {
    expect(comparisonRange({ ...base, compare: 'none' })).toBeNull();
  });
});

describe('filtersToQueryString', () => {
  it('giữ được nhiều marketplace', () => {
    const f = parseFilters({ from: '2026-10-01', to: '2026-10-10', marketplaces: 'shopee,tiki' });
    const qs = filtersToQueryString(f);
    expect(qs).toContain('from=2026-10-01');
    expect(qs).toContain('marketplaces=shopee');
    expect(qs).toContain('marketplaces=tiki');
  });
});
