import { parseIntString } from '@/platform/reports/parse';
import type { PeriodSellerPage, PeriodSellerRow } from './contracts';
import type { RawPeriodSeller, RawPeriodSellerList } from './schema';

export function mapPeriodSeller(raw: RawPeriodSeller): PeriodSellerRow {
  return {
    sellerId: raw.sellerId,
    sellerCode: raw.sellerCode ?? null,
    sellerName: raw.sellerName ?? null,
    primaryCategoryName: raw.primaryCategoryName ?? null,
    orderCount: parseIntString(raw.orderCount),
    gmvVnd: parseIntString(raw.gmvVnd),
    buyerCount: parseIntString(raw.buyerCount),
    gmvSharePercent: raw.gmvSharePercent ?? null,
  };
}

export function mapPeriodSellerList(raw: RawPeriodSellerList): PeriodSellerPage {
  return {
    meta: { ...raw.meta },
    pagination: raw.pagination,
    items: raw.items.map(mapPeriodSeller),
  };
}
