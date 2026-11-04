import Link from 'next/link';

const NAV = [
  { group: 'Dashboard', items: [{ label: 'Dashboard', href: '/growth' }] },
  {
    group: 'B2C',
    items: [
      { label: 'Báo cáo tăng trưởng', href: '/growth' },
      { label: 'Báo cáo chi phí KM', href: '#' },
      { label: 'Báo cáo hiệu suất CTKM', href: '#' },
      { label: 'Báo cáo dòng tiền & cổng thanh toán', href: '#' },
      { label: 'Báo cáo SLA giao hàng', href: '#' },
      { label: 'Báo cáo hoàn tiền & đối soát', href: '#' },
      { label: 'Báo cáo công nợ nhà bán', href: '#' },
      { label: 'Báo cáo đối soát nhà bán', href: '#' },
    ],
  },
  { group: 'Thương Hiệu', items: [{ label: 'Thẻ Sành', href: '#' }] },
  { group: 'Bộ Sưu Tập', items: [{ label: 'Danh mục', href: '#' }] },
  { group: 'Hỗ trợ người dùng', items: [{ label: 'Chat với khách hàng', href: '#' }] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">NT</span>
          <span className="text-sm font-semibold text-slate-800">OBranding</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map((section) => (
            <div key={section.group} className="mb-4">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
            Báo cáo B2C / <span className="text-slate-700">Báo cáo tăng trưởng</span>
          </nav>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Quản trị viên</span>
            <span className="hidden sm:inline">Năm Thành</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
