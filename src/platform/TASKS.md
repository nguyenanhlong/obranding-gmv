# FE-A — Shell & Filter · Chinh (@shenny1255-cmyk)

Phạm vi: `app/(growth)/growth/layout.tsx`, `_components/**`, `src/platform/**`, `src/contracts/**`.

## Đã có trên main

- [x] `layout.tsx` + 2 slot `@revenue`, `@orders` chạy được
- [x] `parseFilters()` + test (default range, from>to, vượt 366 ngày, marketplaces CSV/repeated)
- [x] `pickSource()`, `reportFetch()`, `toCsv()`, `REPORT_TAGS`
- [x] UI kit cơ bản: KpiCard, DeltaBadge, ChartFrame, DataTable, EmptyState, SectionPlaceholder
- [x] `/api/reports/revalidate` cho BE
- [x] CI + CODEOWNERS

## Việc của nhánh này

- [ ] FilterBar: chuyển sang điều hướng tức thì (`useTransition` + `router.replace`) thay vì submit form
- [ ] Debounce 300ms cho date range, giữ `scroll: false`
- [ ] Preset kỳ: 7 / 30 / 90 ngày, tháng này, tháng trước
- [ ] Empty / Error state dùng chung, thống nhất copy cho cả 3 slot
- [ ] Skeleton khớp layout thật (tránh nhảy layout khi stream)
- [ ] `ExportButton` generic nhận `href` để B/C tái dùng
- [ ] Kiểm tra `parseFilters` khi `marketplaces` rỗng vs "tất cả" — chốt semantics với BE
- [ ] Test: FilterBar giữ đúng query khi chuyển granularity
- [ ] Set branch protection + required check `verify` sau khi repo lên GitHub

## Không chạm

`@revenue/**`, `@orders/**`, `src/features/**`
