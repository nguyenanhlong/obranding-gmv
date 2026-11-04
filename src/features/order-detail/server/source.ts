import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { OrderSource } from '../contracts';
import { orderMockSource } from './order.mock';

/** TODO (FE-B): thêm `order.http.ts` khi BE bàn giao, rồi đổi ở đây. */
export const orderSource: OrderSource = pickSource(orderMockSource, orderMockSource);
