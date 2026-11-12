'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import {
  SELLER_METRIC_LABEL,
  type SellerMetricKey,
  type SellerSeriesBucket,
} from '../contracts';

type SellerSeriesChartProps = {
  buckets: SellerSeriesBucket[];
  basePath: string;
  /** query hiện tại, chưa gồm bucket */
  query: string;
  height?: number;
};

const METRICS: SellerMetricKey[] = ['orders', 'gmv', 'buyers'];

/** Biểu đồ của API 7: chọn Số đơn / GMV / User, bấm mốc để lọc danh sách đơn. */
export function SellerSeriesChart({
  buckets,
  basePath,
  query,
  height = 300,
}: SellerSeriesChartProps) {
  const [metric, setMetric] = useState<SellerMetricKey>('orders');
  const router = useRouter();
  const isMoney = metric === 'gmv';

  const openBucket = (bucket: SellerSeriesBucket) => {
    const qs = new URLSearchParams(query);
    qs.set('bucket', bucket.key);
    qs.set('page', '1');
    router.push(`${basePath}?${qs.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        {METRICS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              m === metric ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {SELLER_METRIC_LABEL[m]}
          </button>
        ))}
      </div>

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
              tickFormatter={(v: number) => (isMoney ? formatCompactMoney(v) : formatCount(v))}
            />
            <Tooltip
              cursor={{ fill: 'rgba(79,70,229,0.06)' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(value, _name, item) => {
                const bucket = item?.payload as SellerSeriesBucket | undefined;
                const text = isMoney ? formatCompactMoney(Number(value)) : formatCount(Number(value));
                return [
                  `${text} · ${bucket?.orders ?? 0} đơn · ${formatCompactMoney(bucket?.gmv ?? 0)}`,
                  SELLER_METRIC_LABEL[metric],
                ];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Bar
              dataKey={metric}
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(entry) => {
                const bucket = entry as unknown as SellerSeriesBucket;
                if (bucket.orders > 0) openBucket(bucket);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500">
        Rê chuột để xem nhanh · bấm một mốc để lọc danh sách đơn bên dưới (mốc 0 đơn không lọc).
      </p>
    </div>
  );
}
