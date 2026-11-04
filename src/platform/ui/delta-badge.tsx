import type { Delta } from '@/contracts/base';
import { cn } from '@/platform/ui/cn';
import { formatSignedPercent } from '@/platform/format/percent';

export function DeltaBadge({ delta, className }: { delta: Delta; className?: string }) {
  const tone =
    delta.direction === 'up'
      ? 'bg-emerald-50 text-emerald-700'
      : delta.direction === 'down'
        ? 'bg-rose-50 text-rose-700'
        : 'bg-slate-100 text-slate-600';

  const arrow = delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '—';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        tone,
        className,
      )}
      title={delta.compareTo ? `So với ${delta.compareTo.from} → ${delta.compareTo.to}` : undefined}
    >
      <span aria-hidden>{arrow}</span>
      {delta.pct === null ? 'mới' : formatSignedPercent(delta.pct)}
    </span>
  );
}
