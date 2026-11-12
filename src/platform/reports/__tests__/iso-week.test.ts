import { describe, expect, it } from 'vitest';
import { bucketOf, bucketRange, isoWeekKey, mondayOfIsoWeek } from '@/platform/time';

describe('isoWeekKey', () => {
  it('trả key dạng YYYY-Www', () => {
    expect(isoWeekKey('2026-10-05')).toBe('2026-W41');
    expect(isoWeekKey('2026-01-01')).toBe('2026-W01');
  });

  it('dùng ISO weekYear: đầu tháng 1 vẫn thuộc năm trước', () => {
    // 01/01/2027 là thứ Sáu → thuộc tuần cuối của 2026
    expect(isoWeekKey('2027-01-01').startsWith('2026-W')).toBe(true);
  });

  it('round-trip với mondayOfIsoWeek', () => {
    for (const date of ['2026-10-05', '2026-03-15', '2026-12-31']) {
      const key = isoWeekKey(date);
      const monday = mondayOfIsoWeek(key);
      expect(bucketOf(monday, 'week')).toBe(key);
    }
  });
});

describe('bucketRange cho tuần', () => {
  it('trả thứ Hai đến Chủ nhật', () => {
    expect(bucketRange('2026-W41', 'week')).toEqual({
      from: '2026-10-05',
      to: '2026-10-11',
    });
  });
});
