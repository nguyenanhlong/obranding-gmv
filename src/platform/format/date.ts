import type { Period } from '@/contracts/base';

const TZ = 'Asia/Ho_Chi_Minh';

const dayMonth = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  timeZone: TZ,
});
const dayMonthYear = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TZ,
});
/** en-GB cho ra "30/09/2026, 22:15:14" — tự ghép lại theo dd/MM/yyyy HH:mm:ss */
const dateTimeParts = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: TZ,
});

/** Chỉ ngày (YYYY-MM-DD) → coi như 00:00 UTC, hiển thị theo giờ VN vẫn đúng ngày */
function atNoonUtc(isoDate: string): Date | null {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDayMonth(iso: string): string {
  const d = atNoonUtc(iso);
  return d ? dayMonth.format(d) : iso;
}

export function formatDate(iso: string): string {
  const d = atNoonUtc(iso);
  return d ? dayMonthYear.format(d) : iso;
}

/** timestamp ISO (UTC hoặc có offset) → 'dd/MM/yyyy HH:mm:ss' theo giờ Việt Nam */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateTimeParts.format(d).replace(', ', ' ');
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
