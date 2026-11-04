import type { Marketplace } from '@/contracts/base';

/** Dữ liệu tham chiếu — BE sẽ trả qua /v1/reports/meta/marketplaces */
export const MARKETPLACES: Marketplace[] = [
  { id: 'shopee', name: 'Shopee' },
  { id: 'tiktok', name: 'TikTok Shop' },
  { id: 'lazada', name: 'Lazada' },
  { id: 'tiki', name: 'Tiki' },
];
