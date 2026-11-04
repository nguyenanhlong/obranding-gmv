const vnd = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export function formatMoney(amount: number, currency = '₫'): string {
  return `${vnd.format(amount)} ${currency}`;
}

/** 1.234.567.890 -> '1,23 tỷ' */
export function formatCompactMoney(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2).replace('.', ',')} tỷ`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} tr`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return vnd.format(amount);
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n);
}
