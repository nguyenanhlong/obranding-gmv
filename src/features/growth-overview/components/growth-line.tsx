'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CartesianGrid,
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

type GrowthLineProps = {
  periods: GrowthPeriod[];
  groupBy: string;
  height?: number;
};

const METRICS: GrowthMetricKey[] = ['orders', 'buyers', 'gmv'];

/**
 * Biểu đồ đường theo ô "Chỉ số tăng trưởng". Đổi chỉ số bằng state client,
 * không gọi lại API (hợp đồng API 1 mục 3.5).
 */
export function GrowthLine({ periods, groupBy, height = 320 }: GrowthLineProps) {
  const [metric, setMetric] = useState<GrowthMetricKey>('orders');
  const router = useRouter();
  const data = toGrowthLineData(periods, metric, groupBy);
  const isMoney = metric === 'gmv';

  const openPeriod = (point: GrowthLineDatum) => {
    const qs = new URLSearchParams({
      from: point.startDate,
      to: point.endDate,
      period: groupBy.toLowerCase(),
    });
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
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
              formatter={(value, name, item) => {
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
              dot={{ r: 2, strokeWidth: 0, fill: '#4f46e5' }}
              activeDot={{ r: 5, cursor: 'pointer' }}
              onClick={(entry) => openPeriod(entry as unknown as GrowthLineDatum)}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500">
        Rê chuột để xem số liệu · bấm một mốc để mở chi tiết kỳ
      </p>
    </div>
  );
}
