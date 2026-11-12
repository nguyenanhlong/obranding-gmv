'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactMoney } from '@/platform/format/money';
import type { BuyerSeriesBucket } from '../contracts';

/** API 8: cột giá trị mua theo mốc, tooltip hiện thêm số đơn. */
export function BuyerSeriesChart({
  buckets,
  height = 300,
}: {
  buckets: BuyerSeriesBucket[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="shortLabel"
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
            tickFormatter={(v: number) => formatCompactMoney(v)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(79,70,229,0.06)' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value, _name, item) => {
              const bucket = item?.payload as BuyerSeriesBucket | undefined;
              return [
                `${formatCompactMoney(Number(value))} · ${bucket?.orders ?? 0} đơn`,
                'Giá trị mua',
              ];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
