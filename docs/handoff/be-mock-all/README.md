# Bàn giao mock data — TOÀN BỘ 5 màn hình

Gói này để team BE thấy **FE đang kỳ vọng dữ liệu gì** ở cả 5 màn, kèm logic mock đang chạy
để đối chiếu công thức.

> Đây là **mock của FE**, không phải dữ liệu thật và không phải đặc tả BE.
> Đặc tả chính thức nằm ở các hợp đồng `API_1..8_Contract.docx` trong `doi_chieu/`.

## 5 màn và người phụ trách

| Màn | Route | Sample | Owner FE | Trạng thái |
|---|---|---|---|---|
| M1 Báo cáo tăng trưởng | `/growth` | `m1-growth-report.json` | Chinh (FE-A) | Khớp API 1 |
| M2 Chi tiết kỳ | `/growth/period` | `m2-period-summary.json`, `m2-orders-page.json`, `m2-period-buyers.json`, `m2-period-sellers.json` | Long (FE-B) | Khớp API 6 + API 2 + API 3 + API 4 |
| M4 Chi tiết user | `/growth/customers/[id]` | `m4-buyer-summary.json` + `m4-orders-page.json` | Phuc (FE-C) | Khớp API 8 + API 2 (scope CUSTOMER) |
| M5 Chi tiết nhà bán | `/growth/sellers/[id]` | `m5-seller-summary.json` + `m5-orders-page.json` | Phuc (FE-C) | Khớp API 7 + API 2 (scope SELLER) |
| M6 Chi tiết đơn | `/orders/[id]` (drawer) | `m6-order-detail.json` | Long (FE-B) | Khớp API 5 (`view=growthDrawer`) |

## Nên mở file nào trước

| Thứ tự | File | Để làm gì |
|---|---|---|
| 1 | `api-contract.md` | Bảng 8 endpoint + field + đơn vị + điểm cần chốt |
| 2 | `samples/m2-period-summary.json` | Response phức tạp nhất (6 KPI + distribution theo unit) |
| 3 | `samples/m2-orders-page.json` | API 2 — một endpoint cho 3 màn (meta + pagination + items) |
| 4 | `samples/m2-period-buyers.json`, `m2-period-sellers.json` | API 3/4 — 2 tab còn lại của Chi tiết kỳ |
| 5 | `samples/m6-order-detail.json` | API 5 — drawer: items[], discountBreakdown[], milestones null được |
| 6 | `samples/m1-growth-report.json` | Response của hub (meta + periods, 3 danh sách top mỗi kỳ) |
| 7 | `reference/src/...` | Đọc logic mock nếu cần đối chiếu công thức |

## Cấu trúc

```
be-mock-all/
├─ README.md
├─ api-contract.md
├─ samples/
│  ├─ m1-growth-report.json        M1 — meta + periods[], mỗi kỳ 4 metric + 3 danh sách top
│  ├─ m2-period-summary.json       M2 — period + 6 KPI + distribution{unit,buckets,peak}
│  ├─ m2-orders-page.json          M2 — API 2 scope=PERIOD (meta + pagination + items)
│  ├─ m2-period-buyers.json        M2 — API 3 (tab User mua hàng)
│  ├─ m2-period-sellers.json       M2 — API 4 (tab Nhà bán)
│  ├─ m4-buyer-summary.json        M4 — customer + kpis + series + topSellers
│  ├─ m4-orders-page.json          M4 — API 2 scope=CUSTOMER
│  ├─ m5-seller-summary.json       M5 — seller + kpis + series theo unit
│  ├─ m5-orders-page.json          M5 — API 2 scope=SELLER
│  ├─ m6-order-detail.json         M6 — API 5 growthDrawer: items, ưu đãi, tổng, tiến trình
│  ├─ orders.100rows.csv           100 đơn mẫu, có BOM
│  └─ dataset-summary.json         tổng quan dataset
└─ reference/src/
   ├─ contracts/base.ts                     Money, Delta, Period, Page, enum cũ
   ├─ platform/time.ts                      bucketOf, bucketRange, isoWeekKey, todayIn/MOCK_NOW
   ├─ platform/format/phone.ts              maskPhone (API 3/5 dùng chung)
   ├─ platform/reports/filters.ts           parseFilters, toApiQuery, validator, clampToToday
   ├─ platform/reports/series.ts            unit DAY/MONTH/QUARTER, bucket cắt theo khoảng
   ├─ platform/reports/parse.ts             parseIntString, percentToRatio
   ├─ platform/reports/orders/...           API 2: contracts, schema, mapper, mock, http
   ├─ platform/reports/period-buyers/...    API 3
   ├─ platform/reports/period-sellers/...   API 4
   ├─ platform/mock/dataset.ts              sinh dataset
   ├─ platform/mock/aggregate.ts            totalsOf, deltaOf, newBuyerRate, filterRange
   ├─ features/growth-overview/...          M1: contracts, schema, mapper, raw, mock
   ├─ features/period-detail/...            M2
   ├─ features/buyer-detail/...             M4
   ├─ features/seller-detail/...            M5
   └─ features/order-detail/...             M6
```

Trong `reference/`, dòng `import 'server-only'` đã được bỏ (package đó chỉ có trong Next).

## Quy ước FE đang dùng

| Quy ước | Giá trị |
|---|---|
| Đơn vị tiền | **integer VND**, không minor unit |
| Đơn vị đếm | **đơn con theo nhà bán** (`parent_order_id IS NOT NULL`, trừ đơn một nhà bán) |
| Mốc thời gian | `placed_at`, kỳ `[00:00, 23:59:59]` giờ **UTC+7**; response trả ISO UTC |
| Phân trang | `page` **1-based** (≤ 10.000); `pageSize` 10/20/50/100 (API 2), 10/20/30 (API 3/4) |
| Số trong response | **chuỗi** số nguyên; FE parse ở mapper |
| Phần trăm | BE trả **đã ×100**, 1 chữ số thập phân |
| Đơn hợp lệ | `status <> 'CANCELLED'` cho KPI; danh sách đơn scope SELLER mặc định `status=ALL` |

## Những gì FE đã giả định (cần BE xác nhận)

1. **GMV** = `order_total` (sau ưu đãi, gồm phí ship).
2. **Đơn `NEEDS_RESOLUTION`** vẫn tính vào số đơn.
3. **User mua hàng** = `COUNT(DISTINCT customer_id)`, không cộng dồn giữa các kỳ.
4. **Tỉ lệ khách mới** = khách không có đơn hợp lệ nào trước `startDate`, chia cho số buyer của kỳ.
5. **Kỳ PROVISIONAL** (đang diễn ra): so với đoạn tương ứng của kỳ trước; FE hiện `~`.
6. **M5 — Đơn/user** = số đơn / số user tham gia mua trong kỳ.
7. **Badge tab Đơn hàng** = `kpis.orders.value` của API 6 (chờ BE chốt với API 2).
8. **Danh mục chính** ở bảng dùng `primaryCategoryName` (API 2/4); header trang nhà bán dùng `mainCategory` (API 7).
9. **Lọc mốc nhà bán** giữ `status=ALL` (gồm đơn huỷ) và có ghi chú dưới bảng.
10. **API 5** mở dạng drawer (intercepting route); vẫn giữ trang `/orders/[id]` cho F5/link trực tiếp.

## Khi BE xong API

FE chỉ đổi biến môi trường, không sửa UI:

```bash
DATA_SOURCE=api
REPORT_API_BASE_URL=https://...
REPORT_API_TOKEN=...
```

Cả 5 slice đã có `*.http.ts` implement đúng schema; mock và http đi cùng một mapper.

## Điểm dễ lệch cần chốt trước khi code

| # | Vấn đề | Ảnh hưởng nếu lệch |
|---|---|---|
| 1 | Số tiền integer hay string | Mapper phải sửa; `"1.145.300"` dễ thành 1.145 thay vì 1,145 tỷ |
| 2 | Timezone của `placed_at` | Trả UTC thì đơn sau 17:00 giờ VN bị lệch sang ngày hôm sau |
| 3 | `page` 1-based hay 0-based | Lệch 1 đơn vị là sai toàn bộ phân trang |
| 4 | Sort mặc định danh sách đơn | FE giả định mới nhất trước |
| 5 | Shape lỗi (4xx/5xx) | FE đọc `message.message` để hiện lỗi tiếng Việt |
| 6 | 422 của API 5 (đơn cha) | FE hiện EmptyState với message BE trả; cần đúng câu tiếng Việt |
