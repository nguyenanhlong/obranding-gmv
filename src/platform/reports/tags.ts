// Cache tag theo màn hình. Chỉ thêm, không đổi tên tag cũ.
// BE gọi POST /api/reports/revalidate với tag tương ứng.

export const REPORT_TAGS = {
  growth: 'reports:growth',
  period: 'reports:period',
  buyer: 'reports:buyer',
  seller: 'reports:seller',
  order: 'reports:order',
} as const;

export type ReportTag = (typeof REPORT_TAGS)[keyof typeof REPORT_TAGS];

export const REPORT_TAG_PATTERN = /^reports:[a-z-]+$/;
