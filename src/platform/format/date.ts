const dayMonth = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

export function formatDayMonth(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return dayMonth.format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatRange(from: string, to: string): string {
  return `${formatDayMonth(from)} – ${formatDayMonth(to)}`;
}
