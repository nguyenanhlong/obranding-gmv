import type { Delta, DeltaDirection } from '@/contracts/base';
import type { ReportFilters } from '@/platform/reports/filters';
import type { MarketplaceRevenue, RevenueSummary, TimeseriesPoint } from '../contracts';

// ---------------------------------------------------------------- helpers ---

export function toInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;

  const s = value.trim();
  if (!s) return 0;

  // BE có thể trả '1234567', '1234567.00' hoặc '1.234.567'
  const thousands = /^-?\d{1,3}(\.\d{3})+$/;
  const normalized = thousands.test(s) ? s.replace(/\./g, '') : s.replace(/,/g, '');

  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function deltaOf(current: number, previous: number | null): Delta {
  if (previous === null || previous === undefined) {
    return { value: 0, pct: null, direction: 'flat', compareTo: null };
  }

  const value = current - previous;
  const pct = previous === 0 ? null : value / previous;
  const direction: DeltaDirection = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';

  return { value, pct, direction, compareTo: null };
}

export function withCompareTo(delta: Delta, from: string, to: string, enabled: boolean): Delta {
  return enabled ? { ...delta, compareTo: { from, to } } : { ...delta, compareTo: null };
}

// ------------------------------------------------------------ raw (BE) ---

/** Response thô của BE: snake_case, số dạng string. Không export ra ngoài slice. */
export type RawRevenueSummary = {
  gmv: string;
  order_count: string;
  gmv_per_day: string;
  growth_rate: number | null;
  compare_gmv: string | null;
};

export type RawTimeseriesPoint = {
  bucket: string;
  gmv: string;
  orders: number;
  buyers: number;
  gmv_prev: string | null;
};

export type RawMarketplaceRevenue = {
  id: string;
  name: string;
  gmv: string;
  prev_gmv: string | null;
};

// ---------------------------------------------------------------- mappers ---

export function mapSummary(raw: RawRevenueSummary, filters: ReportFilters): RevenueSummary {
  const gmv = toInt(raw.gmv);
  const orderCount = toInt(raw.order_count);
  const previous = raw.compare_gmv === null ? null : toInt(raw.compare_gmv);

  return {
    range: { from: filters.from, to: filters.to },
    gmv: { amount: gmv, currency: 'VND' },
    gmvDelta: deltaOf(gmv, previous),
    orderCount,
    orderCountDelta: deltaOf(orderCount, null),
    gmvPerDay: { amount: toInt(raw.gmv_per_day), currency: 'VND' },
    growthRate: raw.growth_rate,
  };
}

export function mapTimeseries(raw: RawTimeseriesPoint): TimeseriesPoint {
  return {
    bucket: raw.bucket,
    gmv: toInt(raw.gmv),
    orders: raw.orders,
    buyers: raw.buyers,
    gmvPrev: raw.gmv_prev === null ? null : toInt(raw.gmv_prev),
  };
}

export function mapMarketplace(raw: RawMarketplaceRevenue, total: number): MarketplaceRevenue {
  const gmv = toInt(raw.gmv);
  const previous = raw.prev_gmv === null ? null : toInt(raw.prev_gmv);

  return {
    marketplace: { id: raw.id, name: raw.name },
    gmv: { amount: gmv, currency: 'VND' },
    share: total === 0 ? 0 : gmv / total,
    delta: deltaOf(gmv, previous),
  };
}
