import type { Period } from '@/contracts/base';

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

const DEFAULT_MOCK_NOW = '2026-10-27T14:45:00+07:00';

/** "Hôm nay" của hệ thống. Ở chế độ mock, ghim theo MOCK_NOW để demo ổn định. */
function nowForDisplay(): Date {
  if (process.env.DATA_SOURCE !== 'api') {
    const raw = process.env.MOCK_NOW;
    if (raw !== 'off') return new Date(raw && raw.trim() ? raw : DEFAULT_MOCK_NOW);
  }
  return new Date();
}

export function todayIn(tz = 'Asia/Ho_Chi_Minh'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(nowForDisplay());
}

/** Giờ hiện tại (0..23) theo timezone — dùng cho isFuture của kỳ PROVISIONAL. */
export function currentHourIn(tz = 'Asia/Ho_Chi_Minh'): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    hour12: false,
    timeZone: tz,
  }).format(nowForDisplay());
  return Number(hour);
}

/** '2026-W44' theo ISO week-year (tuần bắt đầu thứ Hai). */
export function isoWeekKey(iso: string): string {
  const date = parseDate(iso);
  const thursday = new Date(date.getTime());
  const dow = (date.getUTCDay() + 6) % 7; // thứ 2 = 0
  thursday.setUTCDate(date.getUTCDate() - dow + 3);

  const weekYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(weekYear, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4.getTime());
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);

  const week = Math.floor((thursday.getTime() - week1Monday.getTime()) / (7 * 86_400_000)) + 1;
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

/** '2026-W44' → thứ Hai đầu tuần. */
export function mondayOfIsoWeek(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = Number(yearStr ?? 1970);
  const week = Number(weekStr ?? 1);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4.getTime());
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow + (week - 1) * 7);
  return toIsoDate(week1Monday);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000) + 1;
}

export function daysBetweenRange(from: string, to: string): string[] {
  const total = diffDays(from, to);
  return Array.from({ length: Math.max(0, total) }, (_, i) => addDays(from, i));
}

/** Gom ngày về bucket theo chu kỳ */
export function bucketOf(isoDate: string, period: Period): string {
  if (period === 'month') return isoDate.slice(0, 7);
  if (period === 'quarter') {
    const m = Number(isoDate.slice(5, 7));
    return `${isoDate.slice(0, 4)}-Q${Math.floor((m - 1) / 3) + 1}`;
  }
  if (period === 'year') return isoDate.slice(0, 4);
  if (period === 'week') return isoWeekKey(isoDate);
  return isoDate;
}

/** Kỳ liền trước có cùng độ dài, dùng để tính % tăng trưởng */
export function previousRange(from: string, to: string): { from: string; to: string } {
  const span = diffDays(from, to);
  return { from: addDays(from, -span), to: addDays(to, -span) };
}

/** Khoảng ngày thực của một bucket — dùng khi click chart để drill-down */
export function bucketRange(bucket: string, period: Period): { from: string; to: string } {
  if (period === 'day') return { from: bucket, to: bucket };

  if (period === 'week') {
    const monday = mondayOfIsoWeek(bucket);
    return { from: monday, to: addDays(monday, 6) };
  }

  if (period === 'month') {
    const from = `${bucket}-01`;
    const [y, m] = bucket.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y ?? 1970, m ?? 1, 0)).getUTCDate();
    return { from, to: `${bucket}-${pad(lastDay)}` };
  }

  if (period === 'quarter') {
    const [yStr, qStr] = bucket.split('-Q');
    const year = Number(yStr ?? 1970);
    const quarter = Number(qStr ?? 1);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
    return {
      from: `${year}-${pad(startMonth)}-01`,
      to: `${year}-${pad(endMonth)}-${pad(lastDay)}`,
    };
  }

  return { from: `${bucket}-01-01`, to: `${bucket}-12-31` };
}
