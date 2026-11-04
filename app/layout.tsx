import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Báo cáo tăng trưởng',
  description: 'GMV sàn, đơn hàng và người mua hàng',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
