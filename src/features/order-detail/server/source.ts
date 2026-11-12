import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { OrderSource } from '../contracts';
import { orderHttpSource } from './order.http';
import { orderMockSource } from './order.mock';

/** API 5 — mock hoặc http theo DATA_SOURCE. */
export const orderSource: OrderSource = pickSource(orderMockSource, orderHttpSource);
