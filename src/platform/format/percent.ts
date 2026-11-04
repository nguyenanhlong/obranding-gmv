const pct = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 0.1234 -> '12,3%' */
export function formatPercent(ratio: number): string {
  return `${pct.format(ratio * 100)}%`;
}

/** Chênh lệch có dấu: 0.123 -> '+12,3%' */
export function formatSignedPercent(ratio: number): string {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${pct.format(ratio * 100)}%`;
}
