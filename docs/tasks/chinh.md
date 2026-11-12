# Chinh — FE-A · Shell + M1 Báo cáo tăng trưởng

> **Cập nhật 12/11/2026 (cuối):** M1 đã đồng bộ API 1. Biểu đồ và panel kỳ dùng **chung state**
> (`GrowthHub`): bấm mốc để ghim, 4 chỉ số + 3 danh sách top + nút "Chi tiết kỳ".
> Nhãn % dưới mỗi mốc, điểm PROVISIONAL tô amber, kỳ đầu tiên đã có kỳ so sánh.
> Chi tiết: `docs/doi-chieu/ket-qua-doi-chieu.md`.

Nhánh: `feat/fe-a-chinh` · Route: `/growth` · Feature: `src/features/growth-overview`

## Phạm vi

| Vùng | Ghi chú |
|---|---|
| `app/(admin)/layout.tsx` | sidebar 5 nhóm, breadcrumb, topbar, slot `@drawer` |
| `app/(admin)/growth/page.tsx` | hub: filter, 4 KPI, chart + panel kỳ, bảng số liệu |
| `src/platform/**` | filter, UI kit, format, mock dataset, export, http, reports/* |
| `src/contracts/base.ts` | `Period`, `Delta`, `Page` (OrderRow cũ còn cho dataset) |
| `src/features/growth-overview/**` | contracts, server, components |

## Đã có

- [x] Layout + sidebar + breadcrumb + slot drawer
- [x] `parseFilters` (period/from/to) + test
- [x] Dataset mock deterministic dùng chung cho cả 5 màn, `MOCK_NOW` ghim 27/10/2026
- [x] 4 KPI + chart Recharts có nhãn % dưới mốc, điểm PROVISIONAL khác màu
- [x] Panel kỳ dùng chung state với chart: 4 chỉ số, top nhà bán, top user theo đơn/giá trị, Top 3/5/10
- [x] Nút "Chi tiết kỳ →" gửi `backFrom/backTo/backPeriod`
- [x] Link nhà bán/user dùng bộ lọc tổng quan, `to = min(to, hôm nay)`
- [x] Bắt `ReportApiError` → EmptyState(message BE)
- [x] Export CSV; XLSX/PDF trả 501 có thông báo

## Việc tiếp

- [ ] XLSX/PDF: chốt thư viện (exceljs / pdfkit) rồi implement
- [ ] Preset kỳ ("12 tháng gần nhất") ở bộ lọc
- [ ] Empty/error state cho từng khối, không chỉ cấp trang

## Không chạm

`app/(admin)/growth/period/**`, `customers/**`, `sellers/**`, `orders/**`, `features/{period,buyer,seller,order}-detail/**`
