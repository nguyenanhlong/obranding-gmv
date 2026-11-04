'use client';

export default function GrowthError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-sm font-semibold text-rose-900">Không tải được báo cáo</h2>
      <p className="mt-1 text-sm text-rose-700">
        {error.message || 'Kiểm tra lại khoảng thời gian rồi thử lại.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
      >
        Thử lại
      </button>
    </div>
  );
}
