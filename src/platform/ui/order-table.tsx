import Link from 'next/link';
import { formatDateTime } from '@/platform/format/date';
import { formatMoney } from '@/platform/format/money';
import { DataTable, type Column } from '@/platform/ui/data-table';
import {
  BADGE_LABEL,
  ORDER_STATUS_LABEL,
  paymentLabel,
  type GrowthOrderRow,
} from '@/platform/reports/orders/contracts';

export type OrderTableVariant = 'period' | 'buyer' | 'seller';

type OrderTableProps = {
  rows: GrowthOrderRow[];
  variant: OrderTableVariant;
  startIndex?: number;
};

function statusPill(row: GrowthOrderRow) {
  const tone =
    row.status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : row.status === 'CANCELLED'
        ? 'bg-slate-100 text-slate-500'
        : row.status === 'NEEDS_RESOLUTION'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-sky-50 text-sky-700';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {ORDER_STATUS_LABEL[row.status]}
    </span>
  );
}

/** Bảng đơn dùng chung — dữ liệu là GrowthOrderRow của API 2. */
export function OrderTable({ rows, variant, startIndex = 0 }: OrderTableProps) {
  const indexById = new Map(rows.map((row, i) => [row.orderPublicId, i]));

  const base: Column<GrowthOrderRow>[] = [
    {
      key: 'index',
      header: 'STT',
      align: 'right',
      render: (row) => String((indexById.get(row.orderPublicId) ?? 0) + 1 + startIndex),
    },
    {
      key: 'orderPublicId',
      header: 'Mã đơn hàng',
      render: (row) => (
        <Link
          href={`/orders/${row.orderPublicId}`}
          className="font-mono text-xs text-indigo-700 hover:underline"
          title={row.orderNumber}
        >
          {row.orderPublicId}
        </Link>
      ),
    },
    {
      key: 'placedAt',
      header: 'Ngày đặt hàng',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(row.placedAt)}</span>
      ),
    },
  ];

  const sellerCols: Column<GrowthOrderRow>[] = [
    {
      key: 'sellerCode',
      header: 'Mã nhà bán',
      render: (row) => <span className="font-mono text-xs">{row.sellerCode ?? '—'}</span>,
    },
    { key: 'sellerName', header: 'Tên nhà bán', render: (row) => row.sellerName ?? '—' },
  ];

  const customerCols: Column<GrowthOrderRow>[] = [
    {
      key: 'customerId',
      header: 'Mã KH',
      render: (row) => <span className="font-mono text-xs">{row.customerId ?? '—'}</span>,
    },
    { key: 'customerName', header: 'Khách hàng', render: (row) => row.customerName ?? '—' },
  ];

  const tail: Column<GrowthOrderRow>[] = [
    {
      key: 'orderTotalVnd',
      header: 'Giá trị đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatMoney(row.orderTotalVnd),
    },
    {
      key: 'discountBadges',
      header: 'Ưu đãi',
      render: (row) =>
        row.discountBadges.length === 0 ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {row.discountBadges.map((badge) => (
              <span
                key={badge}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
              >
                {BADGE_LABEL[badge]}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: 'payment',
      header: 'Thanh toán',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">
          {paymentLabel(row.paymentMethod, row.paymentStatus)}
        </span>
      ),
    },
    { key: 'status', header: 'Trạng thái', render: statusPill },
  ];

  const quantity: Column<GrowthOrderRow> = {
    key: 'itemQuantity',
    header: 'SL sản phẩm',
    align: 'right',
    render: (row) => String(row.itemQuantity),
  };

  const columns: Column<GrowthOrderRow>[] =
    variant === 'period'
      ? [
          ...base,
          ...sellerCols,
          ...customerCols,
          { key: 'category', header: 'Danh mục', render: (row) => row.primaryCategoryName ?? '—' },
          { key: 'region', header: 'Khu vực', render: (row) => row.regionName ?? '—' },
          ...tail,
        ]
      : variant === 'buyer'
        ? [
            ...base,
            ...sellerCols,
            { key: 'category', header: 'Danh mục', render: (row) => row.primaryCategoryName ?? '—' },
            quantity,
            ...tail,
          ]
        : [...base, ...customerCols, { key: 'region', header: 'Khu vực', render: (row) => row.regionName ?? '—' }, quantity, ...tail];

  return (
    <DataTable<GrowthOrderRow>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.orderPublicId}
      empty={
        <div className="px-4 py-10 text-center text-sm text-slate-500">
          Không có đơn nào khớp điều kiện lọc.
        </div>
      }
    />
  );
}
