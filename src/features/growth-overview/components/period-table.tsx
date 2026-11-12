import Link from 'next/link';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthPeriod } from '../contracts';

type PeriodTableProps = {
  periods: GrowthPeriod[];
  groupBy: string;
};

/**
 * Bảng "Số liệu theo ngày/tuần/tháng/quý/năm": mỗi dòng 1 kỳ, kỳ mới nhất lên đầu.
 * Tăng trưởng lấy từ orders.growthPercent của chính kỳ đó.
 */
export function PeriodTable({ periods, groupBy }: PeriodTableProps) {
  const rows = [...periods].reverse();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 text-left">Kỳ</th>
            <th className="px-3 py-2 text-left">Thời gian</th>
            <th className="px-3 py-2 text-right">Đơn hàng</th>
            <th className="px-3 py-2 text-right">GMV</th>
            <th className="px-3 py-2 text-right">User mua</th>
            <th className="px-3 py-2 text-right">Nhà bán</th>
            <th className="px-3 py-2 text-right">Tăng trưởng</th>
            <th className="px-3 py-2 text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const qs = new URLSearchParams({
              from: p.startDate,
              to: p.endDate,
              period: groupBy.toLowerCase(),
            }).toString();
            const growth = p.orders.growthPercent;

            return (
              <tr key={p.key} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2">
                  <span className="text-slate-700">{p.label}</span>
                  {p.status === 'PROVISIONAL' ? (
                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                      Tạm tính
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {p.startDate} – {p.endDate}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(p.orders.value)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCompactMoney(p.gmv.value)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(p.buyers.value)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCount(p.activeSellers.value)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {growth === null ? '—' : formatSignedPercent(growth)}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/growth/period?${qs}`}
                    className="text-xs font-medium text-indigo-700 hover:underline"
                  >
                    Chi tiết
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
