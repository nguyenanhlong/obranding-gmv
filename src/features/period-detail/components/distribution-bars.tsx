import type { DistributionBucket, DistributionUnit } from '../contracts';

type DistributionBarsProps = {
  buckets: DistributionBucket[];
  unit: DistributionUnit;
  peak: DistributionBucket | null;
};

const UNIT_NOTE: Record<DistributionUnit, string> = {
  HOUR: 'theo giờ',
  WEEKDAY: 'theo ngày trong tuần',
  DAY: 'theo ngày',
  WEEK: 'theo tuần',
  MONTH: 'theo tháng',
};

/**
 * Bar list thuần CSS (server-rendered). Mốc chưa tới (isFuture) vẽ xám, không tính vào peak.
 * TODO: đổi sang Recharts nếu design cần tooltip khi hover.
 */
export function DistributionBars({ buckets, unit, peak }: DistributionBarsProps) {
  const max = Math.max(1, ...buckets.filter((b) => !b.isFuture).map((b) => b.orders));

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {peak ? `Cao nhất: ${peak.label} · ${peak.orders} đơn` : 'Kỳ này chưa có đơn'}
      </p>

      <div className="flex h-40 items-end gap-[2px] overflow-hidden">
        {buckets.map((bucket) => (
          <div
            key={bucket.key}
            className={`flex-1 rounded-t ${
              bucket.isFuture ? 'bg-slate-200' : 'bg-indigo-500/80 hover:bg-indigo-600'
            }`}
            style={{ height: `${Math.max(2, (bucket.orders / max) * 100)}%` }}
            title={
              bucket.isFuture
                ? `${bucket.label} · chưa tới`
                : `${bucket.label} · ${bucket.orders} đơn`
            }
          />
        ))}
      </div>

      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{buckets[0]?.shortLabel ?? ''}</span>
        <span>{UNIT_NOTE[unit]}</span>
        <span>{buckets[buckets.length - 1]?.shortLabel ?? ''}</span>
      </div>
    </div>
  );
}
