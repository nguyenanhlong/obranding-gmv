import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { BuyerSource } from '../contracts';
import { buyerMockSource } from './buyer.mock';

/** TODO (FE-C): thêm `buyer.http.ts` khi BE bàn giao, rồi đổi ở đây. */
export const buyerSource: BuyerSource = pickSource(buyerMockSource, buyerMockSource);
