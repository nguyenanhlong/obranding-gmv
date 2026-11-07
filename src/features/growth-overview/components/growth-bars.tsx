'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRouter } from 'next/navigation';
import type { Period } from '@/contracts/base';
import { formatCount, formatMoney } from '@/platform/format/money';
import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthPoint } from '../contracts';
import { toGrowthBarData, type GrowthBarDatum } from './growth-bars.data';

type GrowthBarsProps = {
  series: GrowthPoint[];
  period: Period;
  height?: number;
};

const COLOR_CLOSED = '#4f46e5';
const COLOR_CURRENT = '#a5b4fc';

/** Recharts tự truyền active/payload khi dùng `content={<GrowthTooltip />}`. */
function GrowthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  const point = payload?.[0]?.payload as GrowthBarDatum | undefined;
  if (!active || !point) return null;

  return (
    <div className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-900">{point.axisLabel}</span>
        {point.isCurrent ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            Tạm tính
          </span>
        ) : null}
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
        <dt className="text-slate-500">Đơn hàng</dt>
        <dd className="text-right tabular-nums text-slate-900">{formatCount(point.orders)}</dd>
        <dt className="text-slate-500">GMV</dt>
        <dd className="text-right tabular-nums text-slate-900">{formatMoney(point.gmv)}</dd>
        <dt className="text-slate-500">User mua hàng</dt>
        <dd className="text-right tabular-nums text-slate-900">{formatCount(point.buyers)}</dd>
        <dt className="text-slate-500">Tăng trưởng đơn</dt>
        <dd className="text-right tabular-nums text-slate-900">
          {point.growthPct === null ? '—' : formatSignedPercent(point.growthPct)}
        </dd>
      </dl>
      {point.isCurrent ? (
        <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
          Kỳ chưa kết thúc, số liệu còn thay đổi
        </p>
      ) : null}
    </div>
  );
}

/**
 * Chart cột theo kỳ. Nhãn % tăng trưởng đặt trên đỉnh cột (đúng như M1);
 * kỳ đang diễn ra tô nhạt và ghi "tạm tính".
 * Click 1 cột → mở màn chi tiết kỳ (M2) với đúng khoảng ngày của bucket.
 */
export function GrowthBars({ series, period, height = 320 }: GrowthBarsProps) {
  const router = useRouter();
  const data = toGrowthBarData(series, period);
  const hasCurrent = data.some((d) => d.isCurrent);

  const openPeriod = (point: GrowthPoint) => {
    const qs = new URLSearchParams({ from: point.from, to: point.to, period: 'day' });
    router.push(`/growth/period?${qs.toString()}`);
  };

  return (
    <div className="w-full">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="axisLabel"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(value: number) => formatCount(value)}
            />
            <Tooltip cursor={{ fill: 'rgba(79,70,229,0.06)' }} content={<GrowthTooltip />} />
            <Bar
              dataKey="orders"
              name="orders"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(entry) => openPeriod(entry as unknown as GrowthPoint)}
            >
              {data.map((point) => (
                <Cell key={point.bucket} fill={point.isCurrent ? COLOR_CURRENT : COLOR_CLOSED} />
              ))}
              <LabelList dataKey="topLabel" position="top" fontSize={10} fill="#64748b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hasCurrent ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: COLOR_CURRENT }} />
          Kỳ đang diễn ra — số liệu tạm tính
        </p>
      ) : null}
    </div>
  );
}