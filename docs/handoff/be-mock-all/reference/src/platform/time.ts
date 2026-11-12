import type { Period } from '@/contracts/base';

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

export function todayIn(tz = 'Asia/Ho_Chi_Minh'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
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
  if (period === 'week') {
    const d = parseDate(isoDate);
    const dow = (d.getUTCDay() + 6) % 7; // thứ 2 = 0
    d.setUTCDate(d.getUTCDate() - dow);
    return toIsoDate(d);
  }
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

  if (period === 'week') return { from: bucket, to: addDays(bucket, 6) };

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
