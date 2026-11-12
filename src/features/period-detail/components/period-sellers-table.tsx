import Link from 'next/link';
import { formatCompactMoney } from '@/platform/format/money';
import { DataTable, type Column } from '@/platform/ui/data-table';
import type { PeriodSellerRow } from '@/platform/reports/period-sellers/contracts';

type PeriodSellersTableProps = {
  rows: PeriodSellerRow[];
  startIndex: number;
  /** bộ lọc để mở Chi tiết nhà bán đúng kỳ */
  linkQuery: string;
};

function ShareBar({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-xs text-slate-400">—</span>;
  const width = Math.max(2, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
      </div>
      <span className="tabular-nums text-xs text-slate-600">{percent.toFixed(1).replace('.', ',')}%</span>
    </div>
  );
}

/** Bảng API 4 — 1 dòng / sellerId, xếp cố định theo GMV. */
export function PeriodSellersTable({ rows, startIndex, linkQuery }: PeriodSellersTableProps) {
  const indexOf = new Map(rows.map((row, i) => [row.sellerId, i]));
  const columns: Column<PeriodSellerRow>[] = [
    {
      key: 'index',
      header: 'STT',
      align: 'right',
      render: (row) => String((indexOf.get(row.sellerId) ?? 0) + 1 + startIndex),
    },
    {
      key: 'sellerCode',
      header: 'Mã nhà bán',
      render: (row) => <span className="font-mono text-xs">{row.sellerCode ?? '—'}</span>,
    },
    {
      key: 'sellerName',
      header: 'Tên nhà bán',
      render: (row) => (
        <Link
          href={`/growth/sellers/${encodeURIComponent(row.sellerId)}?${linkQuery}`}
          className="text-sm text-indigo-700 hover:underline"
        >
          {row.sellerName ?? row.sellerId}
        </Link>
      ),
    },
    {
      key: 'primaryCategoryName',
      header: 'Danh mục chính',
      render: (row) => row.primaryCategoryName ?? '—',
    },
    {
      key: 'orderCount',
      header: 'Số đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => String(row.orderCount),
    },
    {
      key: 'gmvVnd',
      header: 'GMV',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatCompactMoney(row.gmvVnd),
    },
    {
      key: 'buyerCount',
      header: 'User mua',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => String(row.buyerCount),
    },
    {
      key: 'gmvSharePercent',
      header: 'Tỷ trọng GMV',
      render: (row) => <ShareBar percent={row.gmvSharePercent} />,
    },
  ];

  return (
    <DataTable<PeriodSellerRow>
      columns={columns}
      rows={rows}
      rowKey={(row) => row.sellerId}
      empty={
        <div className="px-4 py-10 text-center text-sm text-slate-500">
          Không có nhà bán nào khớp điều kiện lọc.
        </div>
      }
    />
  );
}
