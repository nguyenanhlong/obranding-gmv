import type { Delta, Money, Period } from '@/contracts/base';
import type { GrowthPoint, GrowthReport, KpiValue, TopSeller } from '../contracts';

/** Response thô của BE (snake_case, số dạng string) — không export ra ngoài slice */

export type RawKpi = { value: string; prev_value: string | null };

export type RawGrowthPoint = {
  bucket: string;
  from?: string;
  to?: string;
  orders: number;
  gmv: string;
  buyers: number;
  sellers: number;
  growth_pct: number | null;
  is_current: boolean;
};

export type RawTopSeller = {
  seller_id: string;
  seller_code: string;
  seller_name: string;
  category: string;
  orders: number;
  gmv: string;
  growth_pct: number | null;
};

export type RawGrowthReport = {
  kpis: { orders: RawKpi; buyers: RawKpi; gmv: RawKpi; sellers: RawKpi };
  series: RawGrowthPoint[];
  top_sellers: RawTopSeller[];
  total_sellers: number;
};

export function toInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;
  const s = value.trim();
  if (!s) return 0;
  const thousands = /^-?\d{1,3}(\.\d{3})+$/;
  const n = Number(thousands.test(s) ? s.replace(/\./g, '') : s.replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function deltaOf(current: number, prev: number | null): Delta {
  if (prev === null) return { value: 0, pct: null, direction: 'flat' };
  const value = current - prev;
  return {
    value,
    pct: prev === 0 ? null : value / prev,
    direction: value > 0 ? 'up' : value < 0 ? 'down' : 'flat',
  };
}

function kpiOf(raw: RawKpi): KpiValue {
  const value = toInt(raw.value);
  return { value, delta: deltaOf(value, raw.prev_value === null ? null : toInt(raw.prev_value)) };
}

export function mapGrowthReport(raw: RawGrowthReport, period: Period): GrowthReport {
  const gmv: KpiValue & { money: Money } = {
    ...kpiOf(raw.kpis.gmv),
    money: { amount: toInt(raw.kpis.gmv.value), currency: 'VND' },
  };

  const series: GrowthPoint[] = raw.series.map((p) => ({
    bucket: p.bucket,
    from: p.from ?? p.bucket,
    to: p.to ?? p.bucket,
    orders: p.orders,
    gmv: toInt(p.gmv),
    buyers: p.buyers,
    sellers: p.sellers,
    growthPct: p.growth_pct,
    isCurrent: p.is_current,
  }));

  const topSellers: TopSeller[] = raw.top_sellers.map((s) => ({
    sellerId: s.seller_id,
    sellerCode: s.seller_code,
    sellerName: s.seller_name,
    category: s.category,
    orders: s.orders,
    share: 0,
    gmv: { amount: toInt(s.gmv), currency: 'VND' },
    growthPct: s.growth_pct,
  }));

  return {
    period,
    range: { from: '', to: '' },
    kpis: {
      orders: kpiOf(raw.kpis.orders),
      buyers: kpiOf(raw.kpis.buyers),
      gmv,
      sellers: kpiOf(raw.kpis.sellers),
    },
    series,
    topSellers,
    totalSellers: raw.total_sellers,
  };
}
