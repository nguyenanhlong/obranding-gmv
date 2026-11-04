import 'server-only';
import { pickSource } from '@/platform/reports/source';
import type { SellerSource } from '../contracts';
import { sellerMockSource } from './seller.mock';

/** TODO (FE-C): thêm `seller.http.ts` khi BE bàn giao, rồi đổi ở đây. */
export const sellerSource: SellerSource = pickSource(sellerMockSource, sellerMockSource);
