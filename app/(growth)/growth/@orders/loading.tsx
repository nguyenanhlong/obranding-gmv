export default function OrdersLoading() {
  return (
    <section aria-busy="true" aria-label="Đang tải đơn hàng" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </section>
  );
}
