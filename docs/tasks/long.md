# Long — FE-B · M2 Chi tiết kỳ + M6 Chi tiết đơn

Nhánh: `feat/fe-b-long` · Route: `/growth/period`, `/orders/[orderId]`

## Phạm vi

| Vùng | Ghi chú |
|---|---|
| `app/(admin)/growth/period/page.tsx` | M2: 6 KPI, phân bổ theo ngày, bảng 13 cột + search/filter/paging |
| `app/(admin)/orders/[orderId]/page.tsx` | M6: sản phẩm, breakdown ưu đãi, timeline |
| `src/features/period-detail/**` | contracts, mock, source, queries |
| `src/features/order-detail/**` | contracts, mock, source, queries |
| `app/api/exports/period/route.ts` | CSV |

## Đã có

- [x] M2 render được: 6 KPI (đơn, GMV, user, nhà bán, AOV, tỉ lệ khách mới)
- [x] Phân bổ đơn theo ngày + "Cao nhất ngày X"
- [x] Bảng đơn 13 cột, search theo mã đơn/nhà bán/khách, filter trạng thái, phân trang
- [x] M6: breakdown ưu đãi, timeline 5 mốc + mốc huỷ, link từ mã đơn ở mọi bảng
- [x] Export CSV cho M2

## Việc tiếp

- [ ] M2: chart bar hiện là CSS — đổi sang Recharts nếu cần tooltip khi hover
- [ ] M2: toggle 3 series (Đơn hàng / User mua hàng / Nhà bán) như design
- [ ] M2: page size 10/20/30 (hiện cố định qua query)
- [ ] M6: đoạn nối timeline tô cam khi hai mốc liền kề đều có giá trị
- [ ] M6: hiển thị đúng nhãn ưu đãi theo M3 mục 4 (Thẻ Sành nằm trong giảm giá SP)
- [ ] Viết `period.http.ts` + `order.http.ts` khi BE bàn giao

## Không chạm

`layout.tsx`, `src/platform/**`, `src/contracts/**`, `growth/page.tsx`, `customers/**`, `sellers/**`
