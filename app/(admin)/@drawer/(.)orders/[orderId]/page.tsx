import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReportApiError } from '@/platform/reports/http';
import { OrderDrawer } from '@/features/order-detail/components/order-drawer';
import { getOrderDetail } from '@/features/order-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ orderId: string }> };

/** Intercepting route: mở /orders/[orderId] bằng điều hướng client → hiện drawer. */
export default async function OrderDrawerSlot({ params }: PageProps) {
  const { orderId } = await params;

  let detail = null;
  try {
    detail = await getOrderDetail(orderId);
  } catch (error) {
    if (error instanceof ReportApiError) {
      return (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/35" />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative flex h-full w-full max-w-lg flex-col gap-3 bg-white p-5 shadow-2xl"
          >
            <h1 className="text-sm font-semibold text-slate-900">Không mở được chi tiết đơn</h1>
            <p className="text-sm text-slate-600">{error.userMessage}</p>
            <Link href="/growth" className="mt-2 text-xs text-indigo-700 hover:underline">
              ← Về báo cáo tăng trưởng
            </Link>
          </aside>
        </div>
      );
    }
    throw error;
  }

  if (!detail) notFound();

  return <OrderDrawer detail={detail} />;
}
