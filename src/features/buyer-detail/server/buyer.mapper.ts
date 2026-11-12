import { parseIntString, percentToRatioOrZero } from '@/platform/reports/parse';
import type { BuyerSeriesBucket, BuyerSummary, BuyerTopSeller } from '../contracts';
import type { RawBuyerBucket, RawBuyerSummary, RawBuyerTopSeller } from './buyer.schema';

function mapBucket(raw: RawBuyerBucket): BuyerSeriesBucket {
  return {
    key: raw.key,
    label: raw.label,
    shortLabel: raw.shortLabel,
    startDate: raw.startDate,
    endDate: raw.endDate,
    orders: parseIntString(raw.orders),
    value: parseIntString(raw.value),
  };
}

function mapTopSeller(raw: RawBuyerTopSeller): BuyerTopSeller {
  return {
    sellerId: raw.sellerId,
    sellerCode: raw.sellerCode,
    sellerName: raw.sellerName,
    orders: parseIntString(raw.orders),
    value: parseIntString(raw.value),
  };
}

export function mapBuyerSummary(raw: RawBuyerSummary): BuyerSummary {
  return {
    customer: {
      id: raw.customer.customerId,
      name: raw.customer.customerName,
      phoneMasked: raw.customer.phoneMasked ?? null,
      province: raw.customer.province ?? null,
      buyerType: raw.customer.buyerType,
    },
    kpis: {
      totalOrders: parseIntString(raw.kpis.totalOrders),
      validOrders: parseIntString(raw.kpis.validOrders),
      cancelledOrders: parseIntString(raw.kpis.cancelledOrders),
      totalValue: parseIntString(raw.kpis.totalValue),
      aov: parseIntString(raw.kpis.aov),
      completedOrders: parseIntString(raw.kpis.completedOrders),
      completionRate: percentToRatioOrZero(raw.kpis.completionRate),
      sellersCount: parseIntString(raw.kpis.sellersCount),
      firstOrderAt: raw.kpis.firstOrderAt ?? null,
      lastOrderAt: raw.kpis.lastOrderAt ?? null,
    },
    series: {
      unit: raw.series.unit,
      buckets: raw.series.buckets.map(mapBucket),
    },
    topSellers: raw.topSellers.map(mapTopSeller),
  };
}
