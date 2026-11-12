import Link from 'next/link';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { EmptyState } from '@/platform/ui/empty-state';
import type { GrowthPeriod, TopBuyer } from '../contracts';

type TopBuyersPanelProps = {
  period: GrowthPeriod | null;
  groupBy: string;
};

function BuyerList({
  title,
  rows,
  rangeQs,
}: {
  title: string;
  rows: TopBuyer[];
  rangeQs: string;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">Kỳ này chưa có đơn.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
      <ol className="mt-2 space-y-2 text-sm">
        {rows.slice(0, 5).map((buyer, index) => (
          <li key={buyer.customerId} className="flex items-center gap-2">
            <span className="w-4 text-right text-xs text-slate-400">{index + 1}</span>
            <Link
              href={`/growth/customers/${buyer.customerId}?${rangeQs}`}
              className="min-w-0 flex-1 truncate text-slate-700 hover:underline"
            >
              {buyer.customerName}
            </Link>
            <span className="shrink-0 tabular-nums text-xs text-slate-500">
              {formatCount(buyer.orders)} đơn · {formatCompactMoney(buyer.value)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** API 1 đã trả sẵn topBuyersByOrders / topBuyersByValue (API 3 chưa có hợp đồng). */
export function TopBuyersPanel({ period, groupBy }: TopBuyersPanelProps) {
  if (!period) return <EmptyState title="Chưa có kỳ nào để hiển thị top user" />;

  const rangeQs = new URLSearchParams({
    from: period.startDate,
    to: period.endDate,
    period: groupBy.toLowerCase(),
  }).toString();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <BuyerList title="Top user theo số đơn" rows={period.topBuyersByOrders} rangeQs={rangeQs} />
      <BuyerList title="Top user theo giá trị" rows={period.topBuyersByValue} rangeQs={rangeQs} />
    </div>
  );
}
