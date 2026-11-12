import Link from 'next/link';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatPercent, formatSignedPercent } from '@/platform/format/percent';
import { DataTable, type Column } from '@/platform/ui/data-table';
import { EmptyState } from '@/platform/ui/empty-state';
import type { GrowthPeriod, TopSeller } from '../contracts';

type TopSellersTableProps = {
  period: GrowthPeriod | null;
  topN: number;
  groupBy: string;
};

/** Khối "Top nhà bán theo số đơn" của kỳ đang xem (mặc định kỳ FINAL cuối). */
export function TopSellersTable({ period, topN, groupBy }: TopSellersTableProps) {
  if (!period) {
    return <EmptyState title="Chưa có kỳ nào để hiển thị top nhà bán" />;
  }

  const rows = period.topSellersByOrders.slice(0, topN);
  const rangeQs = new URLSearchParams({
    from: period.startDate,
    to: period.endDate,
    period: groupBy.toLowerCase(),
    defFrom: period.startDate,
    defTo: period.endDate,
  }).toString();

  const columns: Column<TopSeller>[] = [
    { key: 'index', header: '#', align: 'right', render: (row) => String(rows.indexOf(row) + 1) },
    {
      key: 'sellerCode',
      header: 'Mã nhà bán',
      render: (row) => (
        <Link
          href={`/growth/sellers/${row.sellerId}?${rangeQs}`}
          className="font-mono text-xs text-indigo-700 hover:underline"
        >
          {row.sellerCode}
        </Link>
      ),
    },
    { key: 'sellerName', header: 'Tên nhà bán', render: (row) => row.sellerName },
    { key: 'category', header: 'Danh mục', render: (row) => row.category || '—' },
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
      render: (row) => formatPercent(row.orderShare),
    },
    {
      key: 'gmv',
      header: 'GMV',
      align: 'right',
      className: 'tabular-nums',
      render: (row) => formatCompactMoney(row.gmv),
    },
    {
      key: 'growth',
      header: 'Tăng trưởng đơn',
      align: 'right',
      className: 'tabular-nums',
      render: (row) =>
        row.growthPercent === null ? '—' : formatSignedPercent(row.growthPercent),
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable<TopSeller> columns={columns} rows={rows} rowKey={(row) => row.sellerId} />
      <p className="text-xs text-slate-500">
        {period.status === 'PROVISIONAL' ? 'Đang diễn ra · tạm tính · ' : ''}
        {formatCount(period.activeSellers.value)} nhà bán có đơn trong kỳ · hiển thị top {topN}
      </p>
    </div>
  );
}
