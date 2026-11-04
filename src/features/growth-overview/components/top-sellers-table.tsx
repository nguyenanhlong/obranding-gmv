import Link from 'next/link';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent, formatSignedPercent } from '@/platform/format/percent';
import { DataTable, type Column } from '@/platform/ui/data-table';
import type { TopSeller } from '../contracts';

type TopSellersTableProps = {
  rows: TopSeller[];
  totalSellers: number;
  topN: number;
};

export function TopSellersTable({ rows, totalSellers, topN }: TopSellersTableProps) {
  const columns: Column<TopSeller>[] = [
    { key: 'index', header: '#', align: 'right', render: (row) => String(rows.indexOf(row) + 1) },
    {
      key: 'sellerCode',
      header: 'Mã nhà bán',
      render: (row) => (
        <Link href={`/growth/sellers/${row.sellerId}`} className="font-mono text-xs text-indigo-700 hover:underline">
          {row.sellerCode}
        </Link>
      ),
    },
    { key: 'sellerName', header: 'Tên nhà bán', render: (row) => row.sellerName },
    { key: 'category', header: 'Danh mục', render: (row) => row.category },
    {
      key: 'orders',
      header: 'Số đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatCount(row.orders),
    },
    {
      key: 'share',
      header: 'Tỉ trọng đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatPercent(row.share),
    },
    {
      key: 'gmv',
      header: 'GMV',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatCompactMoney(row.gmv.amount),
    },
    {
      key: 'growth',
      header: 'Tăng trưởng đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) =>
        row.growthPct === null ? '—' : formatSignedPercent(row.growthPct),
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable<TopSeller> columns={columns} rows={rows} rowKey={(row) => row.sellerId} />
      <p className="text-xs text-slate-500">
        Hiển thị top {topN} trong {formatCount(totalSellers)} nhà bán có đơn · bấm mã nhà bán để xem
        chi tiết
      </p>
    </div>
  );
}
