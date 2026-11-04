import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ORDER_STATUS_LABEL } from '@/contracts/base';
import { formatDateTime } from '@/platform/format/date';
import { formatMoney } from '@/platform/format/money';
import { getOrderDetail } from '@/features/order-detail/server/queries';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ orderId: string }> };

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const detail = await getOrderDetail(orderId);
  if (!detail) notFound();

  const { order } = detail;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/growth" className="text-xs text-indigo-700 hover:underline">
          ← Quay lại báo cáo tăng trưởng
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-lg font-semibold text-slate-900">{order.publicId}</h1>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          Đặt lúc {formatDateTime(order.placedAt)} · {order.payment === 'COD' ? 'COD' : 'Thanh toán trước'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Khách hàng</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between gap-2">
              <dt>Họ tên</dt>
              <dd className="text-slate-800">{order.customerName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Mã KH</dt>
              <dd className="font-mono text-xs text-slate-800">
                {order.customerId.replace('customer-', '')}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Khu vực</dt>
              <dd className="text-slate-800">{order.region}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Nhà bán</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between gap-2">
              <dt>Mã</dt>
              <dd className="font-mono text-xs text-slate-800">{order.sellerCode}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Tên</dt>
              <dd className="text-right text-slate-800">{order.sellerName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Danh mục</dt>
              <dd className="text-slate-800">{order.category}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Tiến trình</h2>
          <ol className="mt-2 space-y-1.5 text-sm">
            {detail.timeline.map((step) => (
              <li key={step.key} className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    step.tone === 'danger'
                      ? 'bg-rose-500'
                      : step.at
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                  }`}
                />
                <span className="text-slate-600">{step.label}</span>
                <span className="ml-auto text-xs text-slate-500">
                  {step.at ? formatDateTime(step.at) : '—'}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Sản phẩm</h2>
        </header>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 text-left">Sản phẩm</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-right">SL</th>
              <th className="px-4 py-2 text-right">Đơn giá</th>
              <th className="px-4 py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3">{detail.product.name}</td>
              <td className="px-4 py-3 font-mono text-xs">{detail.product.sku}</td>
              <td className="px-4 py-3 text-right tabular-nums">{detail.product.quantity}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoney(detail.product.unitPrice)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{formatMoney(detail.subTotal)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Ưu đãi & thanh toán</h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Tạm tính</dt>
            <dd className="tabular-nums">{formatMoney(detail.subTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Phí vận chuyển</dt>
            <dd className="tabular-nums">{formatMoney(detail.shippingFee)}</dd>
          </div>
          {order.discounts.map((d) => (
            <div key={d.label} className="flex justify-between text-slate-600">
              <dt>{d.label}</dt>
              <dd className="tabular-nums">−{formatMoney(d.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <dt>Tổng đơn hàng</dt>
            <dd className="tabular-nums">{formatMoney(detail.total.amount)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">
          Tổng ưu đãi {formatMoney(detail.totalDiscount)} · Thẻ Sành đã nằm trong giảm giá sản phẩm,
          không cộng thêm lần nữa.
        </p>
      </section>
    </div>
  );
}
