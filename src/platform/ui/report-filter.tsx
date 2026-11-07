import Link from 'next/link';
import { filtersToQueryString, type ReportFilters } from '@/platform/reports/filters';
import { activePresetKey, buildPresets } from '@/platform/reports/presets';
import { todayIn } from '@/platform/time';
import { cn } from '@/platform/ui/cn';

type ReportFilterProps = {
  filters: ReportFilters;
  action?: string;
  /** Hiện hàng nút chọn nhanh kỳ (30 ngày, 12 tháng gần nhất…). Mặc định tắt. */
  presets?: boolean;
  /** Tham số ngoài filter cần giữ khi đổi kỳ, VD `{ topN: '5' }`. */
  keep?: Record<string, string | undefined>;
};

/**
 * Filter kỳ dùng chung cho M1/M2 (M4/M5 có khoảng ngày riêng, dùng lại component này).
 * Submit là GET về chính route đang đứng — URL là single source of truth.
 */
export function ReportFilter({ filters, action = '', presets = false, keep = {} }: ReportFilterProps) {
  const kept = Object.entries(keep).filter((e): e is [string, string] => e[1] !== undefined);
  const presetList = presets ? buildPresets(todayIn(filters.tz)) : [];
  const active = activePresetKey(filters, presetList);

  const presetHref = (p: (typeof presetList)[number]) => {
    const qs = new URLSearchParams(
      filtersToQueryString({ ...filters, from: p.from, to: p.to, period: p.period }),
    );
    for (const [k, v] of kept) qs.set(k, v);
    return `${action}?${qs.toString()}`;
  };

  return (
    <form
      method="get"
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Bộ lọc báo cáo"
    >
      {presetList.length > 0 ? (
        <div className="flex w-full flex-wrap items-center gap-1.5" aria-label="Chọn nhanh kỳ">
          <span className="mr-1 text-xs font-medium text-slate-500">Chọn nhanh</span>
          {presetList.map((p) => (
            <Link
              key={p.key}
              href={presetHref(p)}
              aria-current={p.key === active ? 'true' : undefined}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                p.key === active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50',
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      ) : null}

      {kept.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Xem theo</span>
        <select
          name="period"
          defaultValue={filters.period}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="day">Ngày</option>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
          <option value="quarter">Quý</option>
          <option value="year">Năm</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Từ ngày</span>
        <input
          type="date"
          name="from"
          defaultValue={filters.from}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Đến ngày</span>
        <input
          type="date"
          name="to"
          defaultValue={filters.to}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Áp dụng
      </button>

      <span className="ml-auto text-xs text-slate-400">{filters.tz}</span>
    </form>
  );
}