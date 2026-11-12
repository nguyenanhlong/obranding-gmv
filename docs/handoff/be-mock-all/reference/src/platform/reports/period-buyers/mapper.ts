import { parseIntString } from '@/platform/reports/parse';
import type { PeriodBuyerPage, PeriodBuyerRow } from './contracts';
import type { RawPeriodBuyer, RawPeriodBuyerList } from './schema';

export function mapPeriodBuyer(raw: RawPeriodBuyer): PeriodBuyerRow {
  return {
    customerId: raw.customerId,
    customerName: raw.customerName ?? null,
    maskedPhone: raw.maskedPhone ?? null,
    orderCount: parseIntString(raw.orderCount),
    totalValueVnd: parseIntString(raw.totalValueVnd),
    aovVnd: parseIntString(raw.aovVnd),
    regionName: raw.regionName ?? null,
    classification: raw.classification,
    lastOrderAt: raw.lastOrderAt,
  };
}

export function mapPeriodBuyerList(raw: RawPeriodBuyerList): PeriodBuyerPage {
  return {
    meta: { ...raw.meta },
    pagination: raw.pagination,
    items: raw.items.map(mapPeriodBuyer),
  };
}
