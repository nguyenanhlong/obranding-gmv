import type { ReportFilters } from '@/platform/reports/filters';

/**
 * Filter kỳ dùng chung cho M1/M2 (M4/M5 có khoảng ngày riêng, dùng lại component này).
 * Submit là GET về chính route đang đứng — URL là single source of truth.
 */
export function ReportFilter({
  filters,
  action = '',
}: {
  filters: ReportFilters;
  action?: string;
}) {
  return (
    <form
      method="get"
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Bộ lọc báo cáo"
    >
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
