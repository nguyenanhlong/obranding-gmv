# Long — FE-B · M2 Chi tiết kỳ + M6 Chi tiết đơn

> **Cập nhật 12/11/2026 (cuối):** M2 dùng API 6 + API 2 (scope PERIOD) + API 3 + API 4.
> M6 mở dạng **drawer** bằng intercepting route, gọi API 5 `view=growthDrawer`, vẫn giữ trang
> `/orders/[id]` cho F5. Chi tiết trạng thái: `docs/doi-chieu/ket-qua-doi-chieu.md`.

Nhánh: `feat/fe-b-long` · Route: `/growth/period`, `/orders/[orderId]`

## Phạm vi

| Vùng | Ghi chú |
|---|---|
| `app/(admin)/growth/period/page.tsx` | M2: 6 KPI, phân bổ, 3 tab đầy đủ |
| `app/(admin)/@drawer/(.)orders/[orderId]/page.tsx` | M6: drawer |
| `app/(admin)/orders/[orderId]/page.tsx` | M6: trang đầy đủ (F5) |
| `src/features/period-detail/**` | contracts, mock, http, source, queries, 2 bảng API 3/4 |
| `src/features/order-detail/**` | contracts, schema, mapper, mock, http, drawer |
| `src/platform/reports/{orders,period-buyers,period-sellers}/**` | tầng dữ liệu dùng chung |
| `app/api/exports/period/route.ts` | CSV (field mới của API 2) |

## Đã có

- [x] M2: 6 KPI, phân bổ theo unit, badge 3 tab
- [x] API 2 scope PERIOD: `groupBy` + `periodKey`, q (mã đơn/mã-tên khách/nhà bán), status, pageSize 10/20/50/100
- [x] API 3: bảng User mua hàng, sort ORDER_COUNT/TOTAL_VALUE trên URL, link kèm from/to
- [x] API 4: bảng Nhà bán, thanh tỷ trọng GMV, link kèm from/to
- [x] M6: drawer + trang riêng, items[] nhiều dòng, discountBreakdown, milestones null, dataQualityFlags
- [x] 404 → notFound; 422 → EmptyState với message BE

## Việc tiếp (chờ BE chốt hợp đồng)

- [ ] Chốt nguồn số tab Đơn hàng (API 6 vs API 2) — hiện theo API 6
- [ ] Chốt có loại đơn huỷ khi lọc mốc nhà bán — hiện giữ `status=ALL`
- [ ] `PACKED` cần nguồn thời gian độc lập để bỏ `PACKED_TIMESTAMP_UNAVAILABLE`
- [ ] XLSX/PDF cho M2 (đang 501)

## Không chạm

`layout.tsx` (trừ slot drawer), `src/contracts/**`, `growth/page.tsx`, `customers/**`, `sellers/**`
