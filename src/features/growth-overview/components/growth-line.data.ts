import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthPeriod, GrowthMetricKey } from '../contracts';

export const METRIC_LABEL: Record<GrowthMetricKey, string> = {
  orders: 'Đơn hàng',
  buyers: 'User mua hàng',
  gmv: 'GMV',
};

export type GrowthLineDatum = {
  key: string;
  /** nhãn trục X: T10/26, W44/26, 01/09... */
  axisLabel: string;
  value: number;
  growthPercent: number | null;
  /** nhãn % dưới mốc, rỗng khi kỳ trước = 0 */
  growthLabel: string;
  status: GrowthPeriod['status'];
  startDate: string;
  endDate: string;
};

/** Nhãn ngắn trên trục, suy từ periodKey của BE. */
export function axisLabelOf(key: string, groupBy: string): string {
  switch (groupBy) {
    case 'DAY': {
      const [, m, d] = key.split('-');
      return `${d}/${m}`;
    }
    case 'WEEK': {
      const [y, w] = key.split('-W');
      return `W${Number(w)}/${(y ?? '').slice(2)}`;
    }
    case 'MONTH': {
      const [y, m] = key.split('-');
      return `T${Number(m)}/${(y ?? '').slice(2)}`;
    }
    case 'QUARTER': {
      const [y, q] = key.split('-Q');
      return `Q${q}/${(y ?? '').slice(2)}`;
    }
    default:
      return key;
  }
}

export function toGrowthLineData(
  periods: readonly GrowthPeriod[],
  metric: GrowthMetricKey,
  groupBy: string,
): GrowthLineDatum[] {
  return periods.map((p) => ({
    key: p.key,
    axisLabel: axisLabelOf(p.key, groupBy),
    value: p[metric].value,
    growthPercent: p[metric].growthPercent,
    growthLabel:
      p[metric].growthPercent === null ? '' : formatSignedPercent(p[metric].growthPercent),
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
  }));
}
