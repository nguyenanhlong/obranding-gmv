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
import { formatBucket } from '@/platform/format/date';
import { formatCount } from '@/platform/format/money';
import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthPoint } from '../contracts';

type GrowthBarsProps = {
  series: GrowthPoint[];
  period: Period;
  height?: number;
};

/**
 * Chart cột theo kỳ. Nhãn % tăng trưởng đặt trên đỉnh cột (đúng như M1).
 * Click 1 cột → mở màn chi tiết kỳ (M2) với đúng khoảng ngày của bucket.
 */
export function GrowthBars({ series, period, height = 320 }: GrowthBarsProps) {
  const router = useRouter();

  const openPeriod = (point: GrowthPoint) => {
    const qs = new URLSearchParams({ from: point.from, to: point.to, period: 'day' });
    router.push(`/growth/period?${qs.toString()}`);
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(value: string) => formatBucket(value, period)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(value: number) => formatCount(value)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(79,70,229,0.06)' }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 12,
            }}
            labelFormatter={(value) => formatBucket(String(value), period)}
            formatter={(value, name) => [
              formatCount(Number(value)),
              name === 'orders' ? 'Đơn hàng' : String(name),
            ]}
          />
          <Bar
            dataKey="orders"
            name="orders"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(entry) => openPeriod(entry as unknown as GrowthPoint)}
          >
            {series.map((point) => (
              <Cell key={point.bucket} fill={point.isCurrent ? '#a5b4fc' : '#4f46e5'} />
            ))}
            <LabelList
              dataKey="growthPct"
              position="top"
              fontSize={10}
              fill="#64748b"
              formatter={(value) =>
                value === null || value === undefined ? '' : formatSignedPercent(Number(value))
              }
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
