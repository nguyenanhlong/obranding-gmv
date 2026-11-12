import Link from 'next/link';
import { formatDate } from '@/platform/format/date';
import { formatCompactMoney } from '@/platform/format/money';
import { DataTable, type Column } from '@/platform/ui/data-table';
import {
  CLASSIFICATION_LABEL,
  type PeriodBuyerRow,
} from '@/platform/reports/period-buyers/contracts';

type PeriodBuyersTableProps = {
  rows: PeriodBuyerRow[];
  startIndex: number;
  /** bộ lọc để mở Chi tiết user đúng kỳ */
  linkQuery: string;
};

/** Bảng API 3 — 1 dòng / customerId trong kỳ. */
export function PeriodBuyersTable({ rows, startIndex, linkQuery }: PeriodBuyersTableProps) {
  const indexOf = new Map(rows.map((row, i) => [row.customerId, i]));
  const columns: Column<PeriodBuyerRow>[] = [
    {
      key: 'index',
      header: 'STT',
      align: 'right',
      render: (row) => String((indexOf.get(row.customerId) ?? 0) + 1 + startIndex),
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/growth/customers/${encodeURIComponent(row.customerId)}?${linkQuery}`}
            className="block truncate text-sm text-indigo-700 hover:underline"
          >
            {row.customerName ?? row.customerId}
          </Link>
          <span className="font-mono text-[11px] text-slate-400">{row.customerId}</span>
        </div>
      ),
    },
    {
      key: 'maskedPhone',
      header: 'Số điện thoại',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.maskedPhone ?? '—'}</span>
      ),
    },
    {
      key: 'orderCount',
      header: 'Số đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => String(row.orderCount),
    },
    {
      key: 'totalValueVnd',
      header: 'Tổng giá trị',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatCompactMoney(row.totalValueVnd),
    },
    {
      key: 'aovVnd',
      header: 'Giá trị TB/đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatCompactMoney(row.aovVnd),
    },
    {
      key: 'regionName',
      header: 'Khu vực',
      render: (row) => row.regionName ?? '—',
    },
    {
      key: 'classification',
      header: 'Phân loại',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
            row.classification === 'NEW'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {CLASSIFICATION_LABEL[row.classification]}
        </span>
      ),
    },
    {
      key: 'lastOrderAt',
      header: 'Đơn gần nhất',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">
          {formatDate(row.lastOrderAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable<PeriodBuyerRow>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.customerId}
      empty={
        <div className="px-4 py-10 text-center text-sm text-slate-500">
          Không có khách hàng nào khớp điều kiện lọc.
        </div>
      }
    />
  );
}
