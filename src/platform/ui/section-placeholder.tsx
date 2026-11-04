import { cn } from '@/platform/ui/cn';

type SectionPlaceholderProps = {
  owner: 'FE-A' | 'FE-B' | 'FE-C';
  title: string;
  scope: string;
  className?: string;
};

/**
 * Vùng chờ chủ sở hữu lấp nội dung.
 * Nằm trong file của chính slice nên không ai phải sửa layout để thay nó.
 */
export function SectionPlaceholder({ owner, title, scope, className }: SectionPlaceholderProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center',
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{owner}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{scope}</p>
    </div>
  );
}
