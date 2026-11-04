// Cache tag theo slice. Chỉ thêm, không đổi tên tag cũ.
// Owner: FE-A. BE gọi webhook với tag tương ứng để revalidate.

export const REPORT_TAGS = {
  revenue: 'reports:revenue',
  orders: 'reports:orders',
  buyers: 'reports:buyers',
  meta: 'reports:meta',
} as const;

export type ReportTag = (typeof REPORT_TAGS)[keyof typeof REPORT_TAGS];

export const REPORT_TAG_PATTERN = /^reports:[a-z-]+$/;
