import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReportApiError } from '@/platform/reports/http';
import { EmptyState } from '@/platform/ui/empty-state';
import { OrderDetailBody } from '@/features/order-detail/components/order-detail-body';
import { getOrderDetail } from '@/features/order-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ orderId: string }> };

/** Trang đầy đủ — dùng khi F5 hoặc mở link trực tiếp (API 5 view=growthDrawer). */
export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;

  let detail = null;
  let apiError: ReportApiError | null = null;
  try {
    detail = await getOrderDetail(orderId);
  } catch (error) {
    if (error instanceof ReportApiError) {
      apiError = error;
    } else {
      throw error;
    }
  }

  if (apiError) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Chi tiết đơn hàng</h1>
        <EmptyState
          title="Không xem được đơn hàng này"
          description={apiError.userMessage}
        />
      </div>
    );
  }

  if (!detail) notFound();

  return (
    <div className="space-y-4">
      <Link href="/growth" className="text-xs text-indigo-700 hover:underline">
        ← Quay lại báo cáo tăng trưởng
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <OrderDetailBody detail={detail} />
      </div>
    </div>
  );
}
