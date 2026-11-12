import {
  parseNullableInt,
  parseIntString,
  percentToRatio,
  percentToRatioOrZero,
} from '@/platform/reports/parse';
import type { GrowthMetric, GrowthPeriod, GrowthReport, TopBuyer, TopSeller } from '../contracts';
import type { RawGrowthPeriod, RawGrowthResponse } from './growth.schema';

function mapMetric(raw: {
  value: string;
  previousValue: string | null;
  growthPercent: number | null;
}): GrowthMetric {
  return {
    value: parseIntString(raw.value),
    previousValue: parseNullableInt(raw.previousValue),
    growthPercent: percentToRatio(raw.growthPercent),
  };
}

function mapBuyer(raw: { customerId: string; customerName: string; orders: string; value: string }): TopBuyer {
  return {
    customerId: raw.customerId,
    customerName: raw.customerName,
    orders: parseIntString(raw.orders),
    value: parseIntString(raw.value),
  };
}

function mapSeller(raw: RawGrowthPeriod['topSellersByOrders'][number]): TopSeller {
  return {
    sellerId: raw.sellerId,
    sellerCode: raw.sellerCode,
    sellerName: raw.sellerName,
    category: raw.category,
    orders: parseIntString(raw.orders),
    gmv: parseIntString(raw.gmv),
    orderShare: percentToRatioOrZero(raw.orderShare),
    growthPercent: percentToRatio(raw.growthPercent),
  };
}

export function mapGrowthPeriod(raw: RawGrowthPeriod): GrowthPeriod {
  return {
    key: raw.periodKey,
    label: raw.periodLabel,
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: raw.status,
    orders: mapMetric(raw.orders),
    buyers: mapMetric(raw.buyers),
    gmv: mapMetric(raw.gmv),
    activeSellers: mapMetric(raw.activeSellers),
    aov: parseIntString(raw.aov),
    topBuyersByOrders: raw.topBuyersByOrders.map(mapBuyer),
    topBuyersByValue: raw.topBuyersByValue.map(mapBuyer),
    topSellersByOrders: raw.topSellersByOrders.map(mapSeller),
  };
}

export function mapGrowthReport(raw: RawGrowthResponse): GrowthReport {
  return {
    meta: {
      startDate: raw.meta.startDate,
      endDate: raw.meta.endDate,
      groupBy: raw.meta.groupBy,
      totalPeriods: raw.meta.totalPeriods,
    },
    periods: raw.periods.map(mapGrowthPeriod),
  };
}
