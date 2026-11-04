// Số liệu theo filter trên URL → mỗi request phải render mới
export const dynamic = 'force-dynamic';

type GrowthLayoutProps = {
  children: React.ReactNode;
  revenue: React.ReactNode;
  orders: React.ReactNode;
};

export default function GrowthLayout({ children, revenue, orders }: GrowthLayoutProps) {
  const mode = process.env.DATA_SOURCE === 'api' ? 'API' : 'Mock';

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Báo cáo tăng trưởng</h1>
            <p className="text-sm text-slate-500">GMV sàn · đơn hàng · người mua hàng</p>
          </div>
          <span
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            title="Đổi bằng biến môi trường DATA_SOURCE"
          >
            Nguồn dữ liệu: {mode}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-6 py-6">
        {children}
        {revenue}
        {orders}
      </main>
    </div>
  );
}
