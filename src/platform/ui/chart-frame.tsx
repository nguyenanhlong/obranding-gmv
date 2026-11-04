import type { ReactNode } from 'react';
import { cn } from '@/platform/ui/cn';

type ChartFrameProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Khung chung cho mọi chart: title, mô tả, vùng vẽ, state rỗng. */
export function ChartFrame({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: ChartFrameProps) {
  return (
    <section
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      aria-label={title}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
        {actions}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
