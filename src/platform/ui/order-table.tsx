import Link from 'next/link';
import { ORDER_STATUS_LABEL, type OrderRow } from '@/contracts/base';
import { formatDateTime } from '@/platform/format/date';
import { formatMoney } from '@/platform/format/money';
import { DataTable, type Column } from '@/platform/ui/data-table';

export type OrderTableVariant = 'period' | 'buyer' | 'seller';

type OrderTableProps = {
  rows: OrderRow[];
  variant: OrderTableVariant;
  /** số thứ tự bắt đầu, để phân trang đúng */
  startIndex?: number;
};

function discountText(row: OrderRow): string {
  if (row.discounts.length === 0) return '—';
  return row.discounts.map((d) => d.label).join(' · ');
}

function statusPill(row: OrderRow) {
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

/** Bảng đơn dùng chung cho M2 / M4 / M5 — mỗi màn chọn variant, cột do đây định nghĩa. */
export function OrderTable({ rows, variant, startIndex = 0 }: OrderTableProps) {
  const indexById = new Map(rows.map((row, i) => [row.id, i]));

  const base: Column<OrderRow>[] = [
    {
      key: 'index',
      header: 'STT',
      align: 'right',
      render: (row) => String((indexById.get(row.id) ?? 0) + 1 + startIndex),
    },
    {
      key: 'publicId',
      header: 'Mã đơn hàng',
      render: (row) => (
        <Link
          href={`/orders/${row.publicId}`}
          className="font-mono text-xs text-indigo-700 hover:underline"
        >
          {row.publicId}
        </Link>
      ),
    },
    {
      key: 'placedAt',
      header: 'Ngày đặt hàng',
      render: (row) => <span className="text-xs text-slate-600">{formatDateTime(row.placedAt)}</span>,
    },
  ];

  const sellerCols: Column<OrderRow>[] = [
    {
      key: 'sellerCode',
      header: 'Mã nhà bán',
      render: (row) => <span className="font-mono text-xs">{row.sellerCode}</span>,
    },
    { key: 'sellerName', header: 'Tên nhà bán', render: (row) => row.sellerName },
  ];

  const customerCols: Column<OrderRow>[] = [
    {
      key: 'customerId',
      header: 'Mã KH',
      render: (row) => <span className="font-mono text-xs">{row.customerId.replace('customer-', '')}</span>,
    },
    { key: 'customerName', header: 'Khách hàng', render: (row) => row.customerName },
  ];

  const tail: Column<OrderRow>[] = [
    {
      key: 'total',
      header: 'Giá trị đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatMoney(row.total.amount),
    },
    {
      key: 'discounts',
      header: 'Ưu đãi',
      render: (row) => <span className="text-xs text-slate-600">{discountText(row)}</span>,
    },
    {
      key: 'payment',
      header: 'Thanh toán',
      render: (row) => (row.payment === 'COD' ? 'COD' : 'Thanh toán trước'),
    },
    { key: 'status', header: 'Trạng thái', render: statusPill },
  ];

  const columns: Column<OrderRow>[] =
    variant === 'period'
      ? [
          ...base,
          ...sellerCols,
          ...customerCols,
          { key: 'category', header: 'Danh mục', render: (row) => row.category },
          { key: 'region', header: 'Khu vực', render: (row) => row.region },
          ...tail,
        ]
      : variant === 'buyer'
        ? [
            ...base,
            ...sellerCols,
            { key: 'category', header: 'Danh mục', render: (row) => row.category },
            {
              key: 'itemCount',
              header: 'SL sản phẩm',
              align: 'right',
              render: (row) => String(row.itemCount),
            },
            ...tail,
          ]
        : [
            ...base,
            ...customerCols,
            { key: 'region', header: 'Khu vực', render: (row) => row.region },
            {
              key: 'itemCount',
              header: 'SL SP',
              align: 'right',
              render: (row) => String(row.itemCount),
            },
            ...tail,
          ];

  return (
    <DataTable<OrderRow>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      empty={
        <div className="px-4 py-10 text-center text-sm text-slate-500">
          Không có đơn nào khớp điều kiện lọc.
        </div>
      }
    />
  );
}
