import { describe, expect, it } from 'vitest';
import type { ReportFilters } from '../filters';
import {
  FilterError,
  assertEntityRange,
  assertGrowthRange,
  assertPeriodRange,
  countPeriods,
  parseFilters,
  toApiQuery,
} from '../filters';
import { parseIntString, parseNullableInt, percentToRatio } from '../parse';

describe('parseIntString', () => {
  it('nhận chuỗi số nguyên của BE', () => {
    expect(parseIntString('1234')).toBe(1234);
    expect(parseIntString('1.234')).toBe(1234);
    expect(parseIntString('41012456000')).toBe(41_012_456_000);
  });

  it('nhận số thực và làm tròn', () => {
    expect(parseIntString('1234.56')).toBe(1235);
    expect(parseIntString(1234.4)).toBe(1234);
  });

  it('an toàn với null, rỗng, rác', () => {
    expect(parseIntString(null)).toBe(0);
    expect(parseIntString(undefined)).toBe(0);
    expect(parseIntString('')).toBe(0);
    expect(parseIntString('không phải số')).toBe(0);
  });
});

describe('parseNullableInt', () => {
  it('giữ null cho previousValue', () => {
    expect(parseNullableInt(null)).toBeNull();
    expect(parseNullableInt('')).toBeNull();
    expect(parseNullableInt('0')).toBe(0);
  });
});

describe('percentToRatio', () => {
  it('10.9% → 0.109', () => {
    expect(percentToRatio(10.9)).toBeCloseTo(0.109, 5);
    expect(percentToRatio(-3.5)).toBeCloseTo(-0.035, 5);
  });

  it('null giữ null', () => {
    expect(percentToRatio(null)).toBeNull();
  });
});

describe('toApiQuery', () => {
  it('đổi tên tham số và viết HOA groupBy', () => {
    const f = parseFilters({ from: '2026-09-01', to: '2026-09-30', period: 'month' });
    expect(toApiQuery(f)).toEqual({
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
      groupBy: 'MONTH',
    });
  });

  it('mọi chu kỳ map đúng', () => {
    for (const [period, expected] of [
      ['day', 'DAY'],
      ['week', 'WEEK'],
      ['quarter', 'QUARTER'],
      ['year', 'YEAR'],
    ] as const) {
      const f = parseFilters({ from: '2026-01-01', to: '2026-01-31', period });
      expect(toApiQuery(f).groupBy).toBe(expected);
    }
  });
});

describe('countPeriods', () => {
  it('đếm theo tháng và theo tuần', () => {
    const byMonth = parseFilters({ from: '2026-01-01', to: '2026-12-31', period: 'month' });
    expect(countPeriods(byMonth)).toBe(12);

    const byWeek = parseFilters({ from: '2026-01-01', to: '2026-01-31', period: 'week' });
    expect(countPeriods(byWeek)).toBeGreaterThanOrEqual(5);
  });
});

describe('assertGrowthRange', () => {
  it('bỏ qua khi trong giới hạn', () => {
    const f = parseFilters({ from: '2020-01-01', to: '2020-03-31', period: 'day' });
    expect(() => assertGrowthRange(f)).not.toThrow();
  });

  it('vượt số kỳ của DAY thì ném lỗi', () => {
    const f = parseFilters({ from: '2020-01-01', to: '2020-04-30', period: 'day' });
    expect(() => assertGrowthRange(f)).toThrow(FilterError);
    expect(() => assertGrowthRange(f)).toThrow(/tối đa 93 kỳ/);
  });

  it('toDate sau hôm nay thì ném lỗi', () => {
    const f = parseFilters({ from: '2099-01-01', to: '2099-01-02', period: 'day' });
    expect(() => assertGrowthRange(f)).toThrow(/sau ngày hôm nay/);
  });
});

describe('assertPeriodRange', () => {
  it('cùng một kỳ thì hợp lệ, kể cả toDate ở tương lai', () => {
    const f = parseFilters({ from: '2099-01-05', to: '2099-01-20', period: 'month' });
    // fromDate vẫn phải ≤ hôm nay nên trường hợp này phải ném
    expect(() => assertPeriodRange(f)).toThrow(/fromDate/);
  });

  it('khác kỳ thì ném lỗi', () => {
    const f = parseFilters({ from: '2020-09-01', to: '2020-10-01', period: 'month' });
    expect(() => assertPeriodRange(f)).toThrow(/cùng một kỳ MONTH/);
  });

  it('cùng tháng thì hợp lệ', () => {
    const f = parseFilters({ from: '2020-09-01', to: '2020-09-30', period: 'month' });
    expect(() => assertPeriodRange(f)).not.toThrow();
  });
});

describe('assertEntityRange', () => {
  it('quá 1096 ngày thì ném lỗi', () => {
    // parseFilters đã chặn 1096 ngày, nên dựng trực tiếp filter để test validator
    const f: ReportFilters = {
      from: '2020-01-01',
      to: '2023-12-31',
      period: 'day',
      tz: 'Asia/Ho_Chi_Minh',
    };
    expect(() => assertEntityRange(f)).toThrow(/1096 ngày/);
  });

  it('trong 1096 ngày thì hợp lệ', () => {
    const f = parseFilters({ from: '2020-01-01', to: '2020-12-31', period: 'day' });
    expect(() => assertEntityRange(f)).not.toThrow();
  });

  it('toDate sau hôm nay thì ném lỗi', () => {
    const f = parseFilters({ from: '2099-01-01', to: '2099-02-01', period: 'day' });
    expect(() => assertEntityRange(f)).toThrow(/sau ngày hôm nay/);
  });
});
