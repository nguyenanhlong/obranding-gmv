import {
  parseNullableInt,
  parseIntString,
  percentToRatio,
  percentToRatioOrZero,
} from '@/platform/reports/parse';
import type { DistributionBucket, PeriodMetric, PeriodSummary } from '../contracts';
import type { RawPeriodSummary } from './period.schema';

function mapMetric(raw: {
  value: string;
  previousValue: string | null;
  growthPercent: number | null;
}): PeriodMetric {
  return {
    value: parseIntString(raw.value),
    previousValue: parseNullableInt(raw.previousValue),
    growthPercent: percentToRatio(raw.growthPercent),
  };
}

function mapBucket(raw: {
  key: string;
  label: string;
  shortLabel: string;
  orders: string;
  isFuture: boolean;
}): DistributionBucket {
  return {
    key: raw.key,
    label: raw.label,
    shortLabel: raw.shortLabel,
    orders: parseIntString(raw.orders),
    isFuture: raw.isFuture,
  };
}

export function mapPeriodSummary(raw: RawPeriodSummary): PeriodSummary {
  return {
    period: {
      key: raw.period.periodKey,
      label: raw.period.periodLabel,
      groupBy: raw.period.groupBy,
      startDate: raw.period.startDate,
      endDate: raw.period.endDate,
      status: raw.period.status,
    },
    kpis: {
      orders: mapMetric(raw.kpis.orders),
      gmv: mapMetric(raw.kpis.gmv),
      buyers: mapMetric(raw.kpis.buyers),
      activeSellers: mapMetric(raw.kpis.activeSellers),
      aov: parseIntString(raw.kpis.aov),
      newBuyers: parseIntString(raw.kpis.newBuyers),
      newBuyerRate: percentToRatioOrZero(raw.kpis.newBuyerRate),
    },
    distribution: {
      unit: raw.distribution.unit,
      buckets: raw.distribution.buckets.map(mapBucket),
      peak: raw.distribution.peak ? mapBucket(raw.distribution.peak) : null,
    },
  };
}
