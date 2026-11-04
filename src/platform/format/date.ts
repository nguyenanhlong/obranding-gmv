import type { Period } from '@/contracts/base';

const dayMonth = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
const dayMonthYear = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const full = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function toDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDayMonth(iso: string): string {
  const d = toDate(`${iso.slice(0, 10)}T00:00:00Z`);
  return d ? dayMonth.format(d) : iso;
}

export function formatDate(iso: string): string {
  const d = toDate(`${iso.slice(0, 10)}T00:00:00Z`);
  return d ? dayMonthYear.format(d) : iso;
}

export function formatDateTime(iso: string): string {
  const d = toDate(iso);
  return d ? full.format(d) : iso;
}

export function formatRange(from: string, to: string): string {
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/** Nhãn trục cho bucket: '2026-10' hoặc '2026-10-05' hoặc '2026-Q4' */
export function formatBucket(bucket: string, period: Period): string {
  if (period === 'month') {
    const [y, m] = bucket.split('-');
    return `T${Number(m)}/${(y ?? '').slice(2)}`;
  }
  if (period === 'quarter') {
    const [y, q] = bucket.split('-Q');
    return `Q${q}/${(y ?? '').slice(2)}`;
  }
  if (period === 'year') return bucket;
  return formatDayMonth(bucket);
}
