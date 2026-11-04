import type { Marketplace } from '@/contracts/base';
import { eachDay } from '@/platform/reports/filters';
import { MARKETPLACES } from '@/platform/reports/fixtures/marketplaces';

/**
 * Fixture deterministic: cùng input luôn ra cùng số.
 * Cửa sổ dữ liệu cố định để test không phụ thuộc ngày chạy.
 */
export const FIXTURE_FROM = '2026-01-01';
export const FIXTURE_TO = '2026-12-31';

export type DailyRevenue = {
  date: string;
  gmv: number;
  orders: number;
  buyers: number;
  byMarketplace: Record<string, number>;
};

const SHARE: Record<string, number> = {
  shopee: 0.48,
  tiktok: 0.27,
  lazada: 0.15,
  tiki: 0.1,
};

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const BASE_GMV = 420_000_000;
const AOV = 480_000;

function weekdayFactor(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  // cuối tuần sàn TMĐT thường cao hơn
  return dow === 0 || dow === 6 ? 1.18 : 1;
}

function buildSeries(): DailyRevenue[] {
  const rand = lcg(20261103);
  const days = eachDay(FIXTURE_FROM, FIXTURE_TO);

  return days.map((date, i) => {
    const trend = 1 + i * 0.0012;
    const season = 1 + 0.12 * Math.sin((i / 30) * Math.PI * 2);
    const noise = 0.9 + rand() * 0.2;

    const gmv = Math.round(BASE_GMV * trend * season * noise * weekdayFactor(date));
    const orders = Math.max(1, Math.round((gmv / AOV) * (0.95 + rand() * 0.1)));
    const buyers = Math.max(1, Math.round(orders * (0.68 + rand() * 0.08)));

    const byMarketplace: Record<string, number> = {};
    for (const mp of MARKETPLACES) {
      const base = SHARE[mp.id] ?? 0;
      byMarketplace[mp.id] = Math.round(gmv * base * (0.92 + rand() * 0.16));
    }

    return { date, gmv, orders, buyers, byMarketplace };
  });
}

let cache: DailyRevenue[] | null = null;

export function revenueSeries(): DailyRevenue[] {
  cache ??= buildSeries();
  return cache;
}

export function marketplaceList(): Marketplace[] {
  return MARKETPLACES;
}
