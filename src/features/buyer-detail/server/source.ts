import 'server-only';
import type { ReportFilters } from '@/platform/reports/filters';
import { isMockMode } from '@/platform/reports/source';
import type { BuyerOrderQuery, BuyerSource } from '../contracts';
import { buyerMockSource } from './buyer.mock';
import { buyerHttpSource } from './buyer.http';

export const buyerSource: BuyerSource = {
  getSummary: (customerId: string, f: ReportFilters) =>
    isMockMode()
      ? buyerMockSource.getSummary(customerId, f)
      : buyerHttpSource.getSummary(customerId, f),
  listOrders: (customerId: string, f: ReportFilters, q: BuyerOrderQuery) =>
    buyerMockSource.listOrders(customerId, f, q),
};
