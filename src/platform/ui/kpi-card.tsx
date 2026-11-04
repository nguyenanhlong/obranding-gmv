import type { ReactNode } from 'react';
import type { Delta } from '@/contracts/base';
import { cn } from '@/platform/ui/cn';
import { DeltaBadge } from '@/platform/ui/delta-badge';

type KpiCardProps = {
  label: string;
  value: string;
  delta?: Delta;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function KpiCard({ label, value, delta, hint, icon, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>

      <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>

      <div className="flex items-center gap-2">
        {delta ? <DeltaBadge delta={delta} /> : null}
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
    </div>
  );
}
