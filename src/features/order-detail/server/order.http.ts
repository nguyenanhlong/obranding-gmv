import 'server-only';
import { gatewayFetch, ReportNotFoundError } from '@/platform/reports/http';
import type { OrderSource } from '../contracts';
import { mapOrderDrawer } from './order.mapper';
import { orderDrawerSchema } from './order.schema';

/**
 * API 5 — projection chỉ đọc cho drawer. 404 → null (page tự notFound()),
 * 422 (đơn cha / ngoài phạm vi growth) để nguyên ReportApiError cho page hiển thị EmptyState.
 */
export const orderHttpSource: OrderSource = {
  async get(publicId) {
    try {
      const raw = await gatewayFetch(
        `/admin/orders/${encodeURIComponent(publicId)}`,
        orderDrawerSchema,
        { view: 'growthDrawer' },
      );
      return mapOrderDrawer(raw);
    } catch (error) {
      if (error instanceof ReportNotFoundError) return null;
      throw error;
    }
  },
};
