import type { Period } from '@/contracts/base';
import { addDays } from '@/platform/time';
import type { ReportFilters } from './filters';

export type PresetKey = 'last30d' | 'last3m' | 'last12m' | 'thisYear' | 'lastYear';

export type FilterPreset = {
  key: PresetKey;
  label: string;
  from: string;
  to: string;
  period: Period;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Ngày 01 của tháng cách `today` `offset` tháng (offset âm = lùi về trước). */
export function monthStart(today: string, offset: number): string {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7)) - 1 + offset; // 0-based, có thể âm
  const year = y + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  return `${year}-${pad(month + 1)}-01`;
}

/**
 * Các khoảng kỳ chọn nhanh. Tính từ `today` (giờ VN) nên gọi lại mỗi request.
 * "12 tháng gần nhất" lấy tròn tháng: đầu tháng cách đây 11 tháng → hôm nay,
 * nên chart luôn có đúng 12 cột (cột cuối là kỳ đang diễn ra → "tạm tính").
 */
export function buildPresets(today: string): FilterPreset[] {
  const year = Number(today.slice(0, 4));
  return [
    { key: 'last30d', label: '30 ngày', from: addDays(today, -29), to: today, period: 'day' },
    { key: 'last3m', label: '3 tháng', from: monthStart(today, -2), to: today, period: 'week' },
    { key: 'last12m', label: '12 tháng gần nhất', from: monthStart(today, -11), to: today, period: 'month' },
    { key: 'thisYear', label: 'Năm nay', from: `${year}-01-01`, to: today, period: 'month' },
    { key: 'lastYear', label: 'Năm trước', from: `${year - 1}-01-01`, to: `${year - 1}-12-31`, period: 'month' },
  ];
}

/** Preset đang khớp với filter hiện tại (để tô đậm), hoặc null. */
export function activePresetKey(
  filters: Pick<ReportFilters, 'from' | 'to' | 'period'>,
  presets: readonly FilterPreset[],
): PresetKey | null {
  const hit = presets.find(
    (p) => p.from === filters.from && p.to === filters.to && p.period === filters.period,
  );
  return hit?.key ?? null;
}