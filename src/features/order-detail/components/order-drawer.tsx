'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OrderDrawerDetail } from '../contracts';
import { OrderDetailBody } from './order-detail-body';

type Props = {
  detail: OrderDrawerDetail;
};

/** Drawer phải của API 5, mở bằng intercepting route. */
export function OrderDrawer({ detail }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Đóng chi tiết đơn hàng"
        onClick={() => router.back()}
        className="absolute inset-0 bg-slate-900/35"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Thông tin đơn hàng"
        className="relative flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h1 className="text-sm font-semibold text-slate-900">Thông tin đơn hàng</h1>
          <div className="flex items-center gap-3">
            <Link href={`/orders/${encodeURIComponent(detail.orderPublicId)}`} className="text-xs text-indigo-700 hover:underline">
              Mở trang riêng
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <OrderDetailBody detail={detail} />
        </div>
      </aside>
    </div>
  );
}
