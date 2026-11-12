import { parseIntString, percentToRatioOrZero } from '@/platform/reports/parse';
import type { SellerSeriesBucket, SellerSummary } from '../contracts';
import type { RawSellerBucket, RawSellerSummary } from './seller.schema';

export function mapSellerBucket(raw: RawSellerBucket): SellerSeriesBucket {
  return {
    key: raw.key,
    label: raw.label,
    shortLabel: raw.shortLabel,
    startDate: raw.startDate,
    endDate: raw.endDate,
    orders: parseIntString(raw.orders),
    gmv: parseIntString(raw.gmv),
    buyers: parseIntString(raw.buyers),
  };
}

export function mapSellerSummary(raw: RawSellerSummary): SellerSummary {
  return {
    seller: {
      id: raw.seller.sellerId,
      code: raw.seller.sellerCode,
      name: raw.seller.sellerName,
      mainCategory: raw.seller.mainCategory ?? null,
    },
    kpis: {
      orders: parseIntString(raw.kpis.orders),
      gmv: parseIntString(raw.kpis.gmv),
      buyers: parseIntString(raw.kpis.buyers),
      aov: parseIntString(raw.kpis.aov),
      completedOrders: parseIntString(raw.kpis.completedOrders),
      completionRate: percentToRatioOrZero(raw.kpis.completionRate),
      ordersPerBuyer: raw.kpis.ordersPerBuyer,
    },
    series: {
      unit: raw.series.unit,
      buckets: raw.series.buckets.map(mapSellerBucket),
    },
  };
}
