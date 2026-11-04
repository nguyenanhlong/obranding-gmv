import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PERIOD,
  DEFAULT_RANGE_DAYS,
  FilterError,
  MAX_RANGE_DAYS,
  filtersToQueryString,
  parseFilters,
  parsePositiveInt,
  searchParamsToRecord,
} from '../filters';
import { addDays, diffDays, bucketOf, bucketRange, previousRange } from '@/platform/time';

describe('parseFilters', () => {
  it('không có tham số thì mặc định 365 ngày gần nhất, chu kỳ tháng', () => {
    const f = parseFilters({});
    expect(diffDays(f.from, f.to)).toBe(DEFAULT_RANGE_DAYS);
    expect(f.period).toBe(DEFAULT_PERIOD);
    expect(f.tz).toBe('Asia/Ho_Chi_Minh');
  });

  it('chu kỳ lạ rơi về mặc định, không ném lỗi', () => {
    expect(parseFilters({ period: 'quarterly' }).period).toBe(DEFAULT_PERIOD);
    expect(parseFilters({ period: 'quarter' }).period).toBe('quarter');
  });

  it('from > to thì ném FilterError', () => {
    expect(() => parseFilters({ from: '2026-11-10', to: '2026-11-01' })).toThrow(FilterError);
  });

  it('vượt quá số ngày tối đa thì ném FilterError', () => {
    const from = '2025-01-01';
    const to = addDays(from, MAX_RANGE_DAYS + 1);
    expect(() => parseFilters({ from, to })).toThrow(FilterError);
  });

  it('ngày sai định dạng thì ném lỗi', () => {
    expect(() => parseFilters({ from: '01/11/2026' })).toThrow();
  });
});

describe('filtersToQueryString', () => {
  it('giữ đủ 4 tham số', () => {
    const f = parseFilters({ from: '2026-01-01', to: '2026-03-31', period: 'quarter' });
    const qs = filtersToQueryString(f);
    expect(qs).toContain('from=2026-01-01');
    expect(qs).toContain('to=2026-03-31');
    expect(qs).toContain('period=quarter');
  });
});

describe('searchParamsToRecord', () => {
  it('giữ repeated param thay vì lấy phần tử cuối', () => {
    const rec = searchParamsToRecord(new URLSearchParams('a=1&a=2&b=3'));
    expect(rec.a).toEqual(['1', '2']);
    expect(rec.b).toBe('3');
  });
});

describe('parsePositiveInt', () => {
  it('chặn trần và giá trị âm', () => {
    expect(parsePositiveInt('7', 1, 10)).toBe(7);
    expect(parsePositiveInt('99', 1, 10)).toBe(10);
    expect(parsePositiveInt('-3', 5)).toBe(5);
    expect(parsePositiveInt(undefined, 3)).toBe(3);
  });
});

describe('bucketOf', () => {
  it('tháng, quý, năm, tuần', () => {
    expect(bucketOf('2026-10-05', 'month')).toBe('2026-10');
    expect(bucketOf('2026-10-05', 'quarter')).toBe('2026-Q4');
    expect(bucketOf('2026-10-05', 'year')).toBe('2026');
    expect(bucketOf('2026-10-05', 'week')).toBe('2026-10-05'); // thứ 2
  });
});

describe('bucketRange', () => {
  it('khoảng ngày của bucket tháng là đầu tháng đến cuối tháng', () => {
    expect(bucketRange('2026-02', 'month')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(bucketRange('2026-01', 'month')).toEqual({ from: '2026-01-01', to: '2026-01-31' });
  });

  it('quý 4 kết thúc 31/12', () => {
    expect(bucketRange('2026-Q4', 'quarter')).toEqual({ from: '2026-10-01', to: '2026-12-31' });
  });
});

describe('previousRange', () => {
  it('lùi đúng độ dài kỳ', () => {
    expect(previousRange('2026-10-01', '2026-10-10')).toEqual({
      from: '2026-09-21',
      to: '2026-09-30',
    });
  });
});
