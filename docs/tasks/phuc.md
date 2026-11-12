# Phuc — FE-C · M4 Chi tiết user + M5 Chi tiết nhà bán

> **Cập nhật 12/11/2026 (cuối):** M4 dùng API 8, M5 dùng API 7; danh sách đơn cả hai màn đã
> chuyển sang API 2 (scope CUSTOMER / SELLER) với q + status + pageSize 10/20/50/100.
> M5 lọc mốc bằng `?bucket=<key>` (unit lấy từ series), chặn bấm mốc 0 đơn.
> Chi tiết: `docs/doi-chieu/ket-qua-doi-chieu.md`.

Nhánh: `feat/fe-c-phuc` · Route: `/growth/customers/[customerId]`, `/growth/sellers/[sellerId]`

## Phạm vi

| Vùng | Ghi chú |
|---|---|
| `app/(admin)/growth/customers/[customerId]/page.tsx` | M4 |
| `app/(admin)/growth/sellers/[sellerId]/page.tsx` | M5 |
| `src/features/buyer-detail/**` | contracts, mock, http, source, queries |
| `src/features/seller-detail/**` | contracts, mock, http, source, queries |
| `app/api/exports/customer/**`, `app/api/exports/seller/**` | CSV (field mới API 2) |

## Đã có

- [x] M4: 6 KPI, biểu đồ giá trị mua, top 5 nhà bán, bảng đơn (API 2 CUSTOMER)
- [x] M5: 6 KPI, chart đơn/GMV/user theo unit, bảng đơn (API 2 SELLER)
- [x] M4/M5: ô tìm kiếm + lọc trạng thái; đổi filter → page=1
- [x] M5: bấm mốc để lọc đơn, mốc 0 đơn không bấm được, nút "Bỏ lọc mốc"
- [x] Link từ trang tổng quan / tab API 3/4 nhận from/to đã kẹp hôm nay
- [x] 404 của API 7/8 → `notFound()`; 400 → EmptyState(message BE)
- [x] Export CSV dùng field mới của API 2

## Việc tiếp

- [ ] Màn `/growth/sellers` (danh sách tất cả nhà bán) — design nhắc "Xem tất cả"
- [ ] XLSX/PDF cho M4/M5 (đang 501)
- [ ] M5: hiển thị `state` khi trạng thái là NEEDS_RESOLUTION (cần BE chốt nhãn)

## Không chạm

`layout.tsx`, `src/contracts/**`, `growth/page.tsx`, `period/**`, `orders/**`
