'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthMetricKey, GrowthPeriod } from '../contracts';
import { METRIC_LABEL, toGrowthLineData, type GrowthLineDatum } from './growth-line.data';

type Back = { from: string; to: string; period: string };

type GrowthLineProps = {
  periods: GrowthPeriod[];
  groupBy: string;
  /** bộ lọc gốc để nút quay lại giữ đúng filter */
  back?: Back;
  /** kỳ đang ghim trên panel */
  selectedKey?: string;
  /** khi có, bấm mốc chỉ đổi kỳ đang chọn thay vì điều hướng */
  onSelect?: (period: GrowthPeriod) => void;
  height?: number;
};

const METRICS: GrowthMetricKey[] = ['orders', 'buyers', 'gmv'];

function dotColor(status: GrowthLineDatum['status']): string {
  return status === 'PROVISIONAL' ? '#f59e0b' : '#4f46e5';
}

/**
 * Biểu đồ đường theo ô "Chỉ số tăng trưởng". Đổi chỉ số bằng state client,
 * không gọi lại API (hợp đồng API 1 mục 3.5).
 */
export function GrowthLine({
  periods,
  groupBy,
  back,
  selectedKey,
  onSelect,
  height = 320,
}: GrowthLineProps) {
  const [metric, setMetric] = useState<GrowthMetricKey>('orders');
  const router = useRouter();
  const data = toGrowthLineData(periods, metric, groupBy);
  const isMoney = metric === 'gmv';

  const openPeriod = (point: GrowthLineDatum) => {
    const period = periods.find((p) => p.key === point.key);
    if (period && onSelect) {
      onSelect(period);
      return;
    }
    const qs = new URLSearchParams({
      from: point.startDate,
      to: point.endDate,
      period: groupBy.toLowerCase(),
    });
    if (back) {
      qs.set('backFrom', back.from);
      qs.set('backTo', back.to);
      qs.set('backPeriod', back.period);
    }
    router.push(`/growth/period?${qs.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-xs text-slate-500">Chỉ số tăng trưởng</span>
        {METRICS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              m === metric ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
        <span className="ml-2 flex items-center gap-1 text-[11px] text-slate-400">
          <span className="inline-block size-2 rounded-full bg-indigo-600" /> đã chốt
          <span className="ml-1 inline-block size-2 rounded-full bg-amber-500" /> tạm tính
        </span>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="axisLabel"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(value: number) =>
                isMoney ? formatCompactMoney(value) : formatCount(value)
              }
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(value, _name, item) => {
                const point = item?.payload as { growthPercent?: number | null; status?: string };
                const text = isMoney
                  ? formatCompactMoney(Number(value))
                  : formatCount(Number(value));
                const growth =
                  point?.growthPercent === null || point?.growthPercent === undefined
                    ? ''
                    : ` (${point.status === 'PROVISIONAL' ? '~' : ''}${formatSignedPercent(point.growthPercent)})`;
                return [`${text}${growth}`, METRIC_LABEL[metric]];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props as {
                  cx: number;
                  cy: number;
                  payload: GrowthLineDatum;
                  index: number;
                };
                const active = payload.key === selectedKey;
                return (
                  <circle
                    key={`dot-${payload.key}-${index}`}
                    cx={cx}
                    cy={cy}
                    r={active ? 4.5 : 2.5}
                    fill={dotColor(payload.status)}
                    stroke={active ? '#eef2ff' : 'none'}
                    strokeWidth={active ? 3 : 0}
                  />
                );
              }}
              activeDot={{ r: 5, cursor: 'pointer' }}
              onClick={(entry) => openPeriod(entry as unknown as GrowthLineDatum)}
            >
              <LabelList
                dataKey="growthLabel"
                position="bottom"
                offset={8}
                className="fill-slate-400"
                fontSize={10}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500">
        Rê chuột để xem số liệu · bấm một mốc để ghim kỳ vào panel bên dưới
      </p>
    </div>
  );
}
