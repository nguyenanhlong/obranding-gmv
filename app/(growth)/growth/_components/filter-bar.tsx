import type { ReportFilters } from '@/platform/reports/filters';
import { MARKETPLACES } from '@/platform/reports/fixtures/marketplaces';

/**
 * FilterBar server-rendered: submit là GET /growth, URL là single source of truth.
 * FE-A nâng cấp thành điều hướng tức thì (useTransition) khi cần.
 */
export function FilterBar({ filters }: { filters: ReportFilters }) {
  return (
    <form
      method="get"
      action="/growth"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Bộ lọc báo cáo"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Nhóm theo</span>
          <select
            name="granularity"
            defaultValue={filters.granularity}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Kỳ so sánh</span>
          <select
            name="compare"
            defaultValue={filters.compare}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="previous_period">Kỳ trước</option>
            <option value="previous_year">Cùng kỳ năm trước</option>
            <option value="none">Không so sánh</option>
          </select>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-slate-500">Sàn</legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {MARKETPLACES.map((mp) => (
            <label key={mp.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="marketplaces"
                value={mp.id}
                defaultChecked={filters.marketplaces.includes(mp.id)}
                className="size-4 rounded border-slate-300"
              />
              {mp.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Áp dụng
        </button>
        <a href="/growth" className="text-sm text-slate-500 underline-offset-2 hover:underline">
          Đặt lại
        </a>
        <span className="ml-auto text-xs text-slate-400">
          {filters.from} → {filters.to} · {filters.tz}
        </span>
      </div>
    </form>
  );
}
