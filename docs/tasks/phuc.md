# Phuc — FE-C · M4 Chi tiết user + M5 Chi tiết nhà bán

> **Cập nhật 12/11/2026:** M4 dùng API 8, M5 dùng API 7 (series theo unit DAY/MONTH/QUARTER,
> bỏ totalValueDelta, thêm buyerType/phoneMasked/mainCategory/ordersPerBuyer).
> Danh sách đơn vẫn mock (chờ API 2). Chi tiết: `docs/doi-chieu/ket-qua-doi-chieu.md`.


Nhánh: `feat/fe-c-phuc` · Route: `/growth/customers/[customerId]`, `/growth/sellers/[sellerId]`

## Phạm vi

| Vùng | Ghi chú |
|---|---|
| `app/(admin)/growth/customers/[customerId]/page.tsx` | M4 |
| `app/(admin)/growth/sellers/[sellerId]/page.tsx` | M5 |
| `src/features/buyer-detail/**` | contracts, mock, source, queries |
| `src/features/seller-detail/**` | contracts, mock, source, queries |
| `app/api/exports/customer/**`, `app/api/exports/seller/**` | CSV |

## Đã có

- [x] M4: 6 KPI user (số đơn, tổng giá trị, AOV, tỉ lệ hoàn thành, nhà bán đã mua, đơn gần nhất)
- [x] M4: giá trị mua theo tháng + top 5 nhà bán của user + bảng đơn 11 cột
- [x] M5: 6 KPI nhà bán (đơn, GMV, user tham gia, AOV, tỉ lệ hoàn thành, đơn/user)
- [x] M5: chart đơn theo tháng + bảng đơn 12 cột
- [x] Export CSV cho cả hai màn

## Việc tiếp

- [ ] M5: chọn một mốc trên chart để lọc đơn theo tháng đó (design có)
- [ ] M5: cột "Thao tác → Xem đơn" (hiện đã link được từ mã đơn)
- [ ] M4/M5: chart đang là CSS bar — đổi sang Recharts nếu cần 3 series (số đơn / GMV / user)
- [ ] M4: phân trang 14 trang như design, hiện đã có Trước/Tiếp
- [ ] Viết `buyer.http.ts` + `seller.http.ts` khi BE bàn giao
- [ ] Màn `/growth/sellers` (danh sách tất cả nhà bán) chưa có — design nhắc "Xem tất cả"

## Không chạm

`layout.tsx`, `src/platform/**`, `src/contracts/**`, `growth/page.tsx`, `period/**`, `orders/**`
