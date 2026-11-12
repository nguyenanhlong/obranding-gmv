'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDate } from '@/platform/format/date';
import { formatCompactMoney, formatCount } from '@/platform/format/money';
import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthMetric, GrowthPeriod, TopBuyer, TopSeller } from '../contracts';
import { GrowthLine } from './growth-line';

type Back = { from: string; to: string; period: string };

type GrowthHubProps = {
  periods: GrowthPeriod[];
  groupBy: string;
  back: Back;
  /** bộ lọc tổng quan đã kẹp toDate = min(to, hôm nay) */
  linkRange: { from: string; to: string };
  /** kỳ mặc định: FINAL cuối cùng, hoặc PROVISIONAL nếu chỉ có kỳ đó */
  initialKey: string;
};

const METRIC_CARDS = [
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'buyers', label: 'User mua hàng' },
  { key: 'gmv', label: 'GMV' },
  { key: 'activeSellers', label: 'Nhà bán có đơn' },
] as const;

function growthText(metric: GrowthMetric, approximate: boolean): string {
  if (metric.growthPercent === null) return '—';
  return `${approximate ? '~' : ''}${formatSignedPercent(metric.growthPercent)}`;
}

function SellerList({
  rows,
  topN,
  rangeQs,
}: {
  rows: TopSeller[];
  topN: number;
  rangeQs: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">Kỳ này chưa có đơn.</p>;
  return (
    <ol className="space-y-1.5 text-sm">
      {rows.slice(0, topN).map((seller, index) => (
        <li key={seller.sellerId} className="flex items-center gap-2">
          <span className="w-4 text-right text-xs text-slate-400">{index + 1}</span>
          <Link
            href={`/growth/sellers/${encodeURIComponent(seller.sellerId)}?${rangeQs}`}
            className="min-w-0 flex-1 truncate text-slate-700 hover:underline"
          >
            {seller.sellerName}
            <span className="ml-1.5 font-mono text-[11px] text-slate-400">{seller.sellerCode}</span>
          </Link>
          <span className="shrink-0 tabular-nums text-xs text-slate-500">
            {formatCount(seller.orders)} đơn · {formatCompactMoney(seller.gmv)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function BuyerList({
  rows,
  rangeQs,
}: {
  rows: TopBuyer[];
  rangeQs: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">Kỳ này chưa có đơn.</p>;
  return (
    <ol className="space-y-1.5 text-sm">
      {rows.slice(0, 5).map((buyer, index) => (
        <li key={buyer.customerId} className="flex items-center gap-2">
          <span className="w-4 text-right text-xs text-slate-400">{index + 1}</span>
          <Link
            href={`/growth/customers/${encodeURIComponent(buyer.customerId)}?${rangeQs}`}
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
  );
}

/** Biểu đồ + panel kỳ dùng CHUNG state chọn kỳ (rows 9/10/11/13 của đối chiếu). */
export function GrowthHub({ periods, groupBy, back, linkRange, initialKey }: GrowthHubProps) {
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [topN, setTopN] = useState(3);

  const selected =
    periods.find((p) => p.key === selectedKey) ?? periods[periods.length - 1] ?? null;

  if (!selected) {
    return <p className="text-sm text-slate-500">Chưa có kỳ nào trong khoảng đã chọn.</p>;
  }

  const approximate = selected.status === 'PROVISIONAL';
  const rangeQs = new URLSearchParams({
    from: linkRange.from,
    to: linkRange.to,
    period: groupBy.toLowerCase(),
    defFrom: linkRange.from,
    defTo: linkRange.to,
  }).toString();

  const detailQs = new URLSearchParams({
    from: selected.startDate,
    to: selected.endDate,
    period: groupBy.toLowerCase(),
    backFrom: back.from,
    backTo: back.to,
    backPeriod: back.period,
  }).toString();

  return (
    <div className="space-y-5">
      <GrowthLine
        periods={periods}
        groupBy={groupBy}
        back={back}
        selectedKey={selected.key}
        onSelect={(period) => setSelectedKey(period.key)}
      />

      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{selected.label}</h3>
              {approximate ? (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  Đang diễn ra · tạm tính
                </span>
              ) : (
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Đã chốt
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Top</span>
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTopN(n)}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    n === topN ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <Link
              href={`/growth/period?${detailQs}`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Chi tiết kỳ →
            </Link>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {METRIC_CARDS.map((card) => {
            const metric = selected[card.key];
            const isMoney = card.key === 'gmv';
            return (
              <div key={card.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
                  {isMoney ? formatCompactMoney(metric.value) : formatCount(metric.value)}
                </p>
                <p
                  className={`text-[11px] tabular-nums ${
                    metric.growthPercent === null
                      ? 'text-slate-400'
                      : metric.growthPercent >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                  }`}
                >
                  {growthText(metric, approximate)} so với kỳ trước
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Top {topN} nhà bán theo số đơn
            </h4>
            <div className="mt-2">
              <SellerList rows={selected.topSellersByOrders} topN={topN} rangeQs={rangeQs} />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Top user theo số đơn
            </h4>
            <div className="mt-2">
              <BuyerList rows={selected.topBuyersByOrders} rangeQs={rangeQs} />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Top user theo giá trị
            </h4>
            <div className="mt-2">
              <BuyerList rows={selected.topBuyersByValue} rangeQs={rangeQs} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
