export default function GrowthLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải báo cáo" className="space-y-5">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
