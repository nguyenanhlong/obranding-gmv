import type { Period } from '@/contracts/base';
import { formatBucket } from '@/platform/format/date';
import { formatSignedPercent } from '@/platform/format/percent';
import type { GrowthPoint } from '../contracts';

export const PROVISIONAL_LABEL = 'tạm tính';

/** Một cột của chart: GrowthPoint + nhãn đã format sẵn để chart không phải tự tính. */
export type GrowthBarDatum = GrowthPoint & {
  /** nhãn trục X, VD `T10/26` */
  axisLabel: string;
  /** nhãn trên đỉnh cột: % tăng trưởng, hoặc "tạm tính" nếu kỳ chưa kết thúc */
  topLabel: string;
};

/**
 * Kỳ đang diễn ra chưa đủ ngày nên % so với kỳ trước luôn thấp giả tạo
 * → không in % lên cột đó, thay bằng nhãn "tạm tính".
 */
export function toGrowthBarData(series: readonly GrowthPoint[], period: Period): GrowthBarDatum[] {
  return series.map((p) => ({
    ...p,
    axisLabel: formatBucket(p.bucket, period),
    topLabel: p.isCurrent
      ? PROVISIONAL_LABEL
      : p.growthPct === null
        ? ''
        : formatSignedPercent(p.growthPct),
  }));
}