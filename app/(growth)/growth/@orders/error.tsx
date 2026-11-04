'use client';

export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
      <h2 className="text-sm font-semibold text-rose-900">Khối đơn hàng gặp lỗi</h2>
      <p className="mt-1 text-sm text-rose-700">Khối doanh thu phía trên vẫn dùng được.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
      >
        Thử lại
      </button>
    </section>
  );
}
