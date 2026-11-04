import { formatDayMonth, formatDate } from '@/platform/format/date';
import type { DailyBucket } from '../contracts';

/** Bar list thuần CSS — nhẹ, không cần JS. TODO FE-B: đổi sang Recharts nếu design cần tooltip. */
export function DailyBars({ daily, peak }: { daily: DailyBucket[]; peak: DailyBucket | null }) {
  const max = Math.max(1, ...daily.map((d) => d.orders));

  return (
    <div className="space-y-3">
      {peak ? (
        <p className="text-xs text-slate-500">
          Cao nhất: Ngày {Number(peak.date.slice(8, 10))} · {peak.orders} đơn
        </p>
      ) : null}

      <div className="flex h-40 items-end gap-[2px] overflow-hidden">
        {daily.map((d) => (
          <div
            key={d.date}
            className="flex-1 rounded-t bg-indigo-500/80 hover:bg-indigo-600"
            style={{ height: `${Math.max(2, (d.orders / max) * 100)}%` }}
            title={`${formatDate(d.date)} · ${d.orders} đơn`}
          />
        ))}
      </div>

      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{daily[0] ? formatDayMonth(daily[0].date) : ''}</span>
        <span>
          {daily.length > 0 ? formatDayMonth(daily[daily.length - 1]?.date ?? '') : ''}
        </span>
      </div>
    </div>
  );
}
