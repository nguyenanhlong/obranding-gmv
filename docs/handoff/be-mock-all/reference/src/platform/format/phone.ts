/**
 * Mask số điện thoại theo quy tắc hợp đồng API 3 & API 5:
 * chuẩn hóa đầu +84/84 về 0, hiển thị 3 số đầu + '****' + 3 số cuối khi đủ dài;
 * số ngắn hơn chỉ giữ tối đa 2 số cuối. Không bao giờ trả số gốc.
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/^\+?84/, '0').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length >= 7) {
    return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
  }
  return `****${digits.slice(-2)}`;
}
