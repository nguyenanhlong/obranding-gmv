import Link from 'next/link';
import { formatDateTime } from '@/platform/format/date';
import { formatMoney } from '@/platform/format/money';
import {
  ORDER_STATUS_LABEL,
  paymentLabel,
} from '@/platform/reports/orders/contracts';
import {
  DATA_QUALITY_LABEL,
  DISCOUNT_LABEL,
  FUNDED_BY_LABEL,
  MILESTONE_LABEL,
  TIMELINE_INTEGRITY_LABEL,
  type OrderDrawerDetail,
} from '../contracts';

const INTEGRITY_TONE = {
  OK: 'text-emerald-700',
  INCOMPLETE: 'text-amber-700',
  OUT_OF_ORDER: 'text-rose-700',
} as const;

type Props = {
  detail: OrderDrawerDetail;
  /** hiện link mở trang riêng (dùng trong drawer) */
  showFullPageLink?: boolean;
};

/** Nội dung chi tiết đơn — dùng chung cho drawer (API 5) và trang /orders/[id]. */
export function OrderDetailBody({ detail, showFullPageLink = false }: Props) {
  const { customer, seller, payment, totals, delivery } = detail;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-base font-semibold text-slate-900">
            {detail.orderPublicId}
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {ORDER_STATUS_LABEL[detail.status]}
          </span>
          {detail.state ? (
            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
              {detail.state}
            </span>
          ) : null}
          {detail.hasSanhBenefit ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Ưu đãi Thẻ Sành
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Đặt lúc {formatDateTime(detail.placedAt)} · {paymentLabel(payment.method, payment.status)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Khách hàng</h3>
          <dl className="mt-1.5 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Họ tên</dt>
              <dd className="text-right text-slate-800">{customer.customerName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Mã KH</dt>
              <dd className="font-mono text-xs text-slate-800">{customer.customerId}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">SĐT</dt>
              <dd className="font-mono text-xs text-slate-800">{customer.maskedPhone ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nhà bán</h3>
          <dl className="mt-1.5 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Mã</dt>
              <dd className="font-mono text-xs text-slate-800">{seller.sellerCode ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Tên</dt>
              <dd className="text-right text-slate-800">{seller.sellerName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Khu vực</dt>
              <dd className="text-right text-slate-800">{detail.regionName ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vận chuyển</h3>
          <dl className="mt-1.5 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Đơn vị</dt>
              <dd className="text-right text-slate-800">{delivery.carrierName ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Mã vận đơn</dt>
              <dd className="font-mono text-xs text-slate-800">{delivery.trackingCode ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Mốc</dt>
              <dd className={`text-right text-xs font-medium ${INTEGRITY_TONE[delivery.timelineIntegrity]}`}>
                {TIMELINE_INTEGRITY_LABEL[delivery.timelineIntegrity]}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200">
        <header className="border-b border-slate-100 px-3 py-2">
          <h3 className="text-sm font-semibold text-slate-900">Sản phẩm</h3>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left">Sản phẩm</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-right">SL</th>
                <th className="px-3 py-2 text-right">Đơn giá</th>
                <th className="px-3 py-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item) => (
                <tr key={item.itemId} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2 text-slate-800">{item.productName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{item.sku ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(item.unitPriceVnd)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(item.lineSubtotalVnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Ưu đãi</h3>
          {detail.discountBreakdown.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Đơn không có ưu đãi.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {detail.discountBreakdown.map((discount) => (
                <li key={discount.kind} className="flex items-start justify-between gap-2">
                  <span className="text-slate-600">
                    {DISCOUNT_LABEL[discount.kind]}
                    <span className="ml-1 text-[11px] text-slate-400">
                      {FUNDED_BY_LABEL[discount.fundedBy]}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-800">
                    −{formatMoney(discount.amountVnd)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            Thẻ Sành nằm trong giảm giá sản phẩm, không trừ lần hai.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Tổng tiền</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Tạm tính</dt>
              <dd className="tabular-nums">{formatMoney(totals.subtotalVnd)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Phí vận chuyển</dt>
              <dd className="tabular-nums">{formatMoney(totals.shippingFeeVnd)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Tổng ưu đãi</dt>
              <dd className="tabular-nums">−{formatMoney(totals.totalDiscountVnd)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold">
              <dt>Tổng đơn hàng</dt>
              <dd className="tabular-nums">{formatMoney(totals.orderTotalVnd)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 p-3">
        <h3 className="text-sm font-semibold text-slate-900">Tiến trình giao hàng</h3>
        <ol className="mt-2 space-y-1.5 text-sm">
          {delivery.milestones.map((milestone) => (
            <li key={milestone.code} className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  milestone.code === 'CANCELLED' || milestone.code === 'RETURNED'
                    ? 'bg-rose-500'
                    : milestone.occurredAt
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                }`}
              />
              <span className={milestone.occurredAt ? 'text-slate-700' : 'text-slate-400'}>
                {MILESTONE_LABEL[milestone.code]}
              </span>
              <span className="ml-auto text-xs text-slate-500">
                {milestone.occurredAt ? formatDateTime(milestone.occurredAt) : '—'}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-slate-400">
          Mốc chưa có thời gian thật hiển thị “—”, không đánh dấu là đã hoàn tất.
        </p>
      </section>

      {detail.dataQualityFlags.length > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Ghi chú chất lượng dữ liệu
          </h3>
          <ul className="mt-1.5 space-y-1 text-xs text-amber-800">
            {detail.dataQualityFlags.map((flag) => (
              <li key={flag}>• {DATA_QUALITY_LABEL[flag]}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {showFullPageLink ? (
        <Link
          href={`/orders/${encodeURIComponent(detail.orderPublicId)}`}
          className="inline-block text-xs text-indigo-700 hover:underline"
        >
          Mở trang chi tiết đơn →
        </Link>
      ) : null}
    </div>
  );
}
