# Chinh — FE-A · Shell + M1 Báo cáo tăng trưởng

> **Cập nhật 12/11/2026:** M1 đã đồng bộ API 1 (meta + periods, 3 danh sách top, KPI lấy kỳ FINAL cuối);
> hạ tầng chung (gatewayFetch, parse số, toApiQuery, validator) đã xong. Còn lại: tooltip gộp 3 top,
> XLSX/PDF. Chi tiết: `docs/doi-chieu/ket-qua-doi-chieu.md`.


Nhánh: `feat/fe-a-chinh` · Route: `/growth` · Feature: `src/features/growth-overview`

## Phạm vi

| Vùng | Ghi chú |
|---|---|
| `app/(admin)/layout.tsx` | sidebar 5 nhóm, breadcrumb, topbar |
| `app/(admin)/growth/page.tsx` | hub: 3 tab, filter, 4 KPI, chart cột, top nhà bán, panel 12 kỳ |
| `src/platform/**` | filter, UI kit, format, mock dataset, export, http |
| `src/contracts/base.ts` | `OrderRow`, `Period`, `Delta`, `Page` |
| `src/features/growth-overview/**` | contracts, server, components |

## Đã có

- [x] Layout + sidebar + breadcrumb
- [x] `parseFilters` (period/from/to) + test 12 case
- [x] Dataset mock deterministic dùng chung cho cả 5 màn
- [x] 4 KPI + chart cột Recharts có nhãn % tăng trưởng, kỳ hiện tại tô nhạt
- [x] Bảng top 3/5/10 nhà bán + link sang chi tiết nhà bán
- [x] Panel "Số liệu theo tháng"
- [x] Export CSV; XLSX/PDF trả 501 có thông báo

## Việc tiếp

- [ ] 3 tab (`metrics` / `orders` / `buyers`) hiện chỉ đổi style — làm đổi nội dung thật theo design
- [ ] Filter chưa có nút "12 tháng gần nhất" và preset kỳ
- [ ] Chart: thêm tooltip hiển thị GMV + user, và nhãn "tạm tính" cho kỳ đang diễn ra
- [ ] XLSX/PDF: chốt thư viện (exceljs / pdfkit) rồi implement
- [ ] Panel 12 kỳ: nút "Mở rộng"
- [ ] Empty/error state cho từng khối, không chỉ cấp trang

## Không chạm

`app/(admin)/growth/period/**`, `customers/**`, `sellers/**`, `orders/**`, `features/{period,buyer,seller,order}-detail/**`
