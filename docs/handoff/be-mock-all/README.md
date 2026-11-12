# Bàn giao mock data — TOÀN BỘ 5 màn hình

Gói này để team BE thấy **FE đang kỳ vọng dữ liệu gì** ở cả 5 màn, kèm logic mock đang chạy
để đối chiếu công thức.

> Đây là **mock của FE**, không phải dữ liệu thật và không phải đặc tả BE.
> Đặc tả chính thức nằm ở các hợp đồng `API_1/6/7/8_Contract.docx` trong `doi_chieu/`.
> Gói này chỉ chứng minh: với shape đó, FE đã dựng được toàn bộ màn hình.

## 5 màn và người phụ trách

| Màn | Route | Sample | Owner FE | Trạng thái |
|---|---|---|---|---|
| M1 Báo cáo tăng trưởng | `/growth` | `m1-growth-report.json` | Chinh (FE-A) | Khớp API 1 |
| M2 Chi tiết kỳ | `/growth/period` | `m2-period-summary.json` + `m2-orders-page.json` | Long (FE-B) | Summary khớp API 6; đơn chờ API 2 |
| M4 Chi tiết user | `/growth/customers/[id]` | `m4-buyer-summary.json` + `m4-orders-page.json` | Phuc (FE-C) | Summary khớp API 8; đơn chờ API 2 |
| M5 Chi tiết nhà bán | `/growth/sellers/[id]` | `m5-seller-summary.json` + `m5-orders-page.json` | Phuc (FE-C) | Summary khớp API 7; đơn chờ API 2 |
| M6 Chi tiết đơn | `/orders/[id]` | `m6-order-detail.json` | Long (FE-B) | Mock, chờ API 5 |

**API 2/3/4/5 chưa có hợp đồng** → các file `*-orders-page.json` là mock, shape do FE tự đặt,
**không dùng làm chuẩn**. Khi BE có hợp đồng, FE chỉ thay hàm `listOrders()`.

## Nên mở file nào trước

| Thứ tự | File | Để làm gì |
|---|---|---|
| 1 | `api-contract.md` | Bảng 5 endpoint + field + đơn vị + điểm cần chốt |
| 2 | `samples/m2-period-summary.json` | Response phức tạp nhất (6 KPI + distribution theo unit) |
| 3 | `samples/m1-growth-report.json` | Response của hub (meta + periods, 3 danh sách top mỗi kỳ) |
| 4 | `samples/m4-*.json`, `m5-*.json` | Hai màn drill-down |
| 5 | `reference/src/...` | Đọc logic mock nếu cần đối chiếu công thức |

## Cấu trúc

```
be-mock-all/
├─ README.md
├─ api-contract.md
├─ samples/
│  ├─ m1-growth-report.json      M1 — meta + periods[], mỗi kỳ 4 metric + 3 danh sách top
│  ├─ m2-period-summary.json     M2 — period + 6 KPI + distribution{unit,buckets,peak}
│  ├─ m2-orders-page.json        M2 — danh sách đơn (mock, chờ API 2)
│  ├─ m4-buyer-summary.json      M4 — customer + kpis + series + topSellers
│  ├─ m4-orders-page.json        M4 — đơn của user (mock)
│  ├─ m5-seller-summary.json     M5 — seller + kpis + series theo unit
│  ├─ m5-orders-page.json        M5 — đơn của nhà bán (mock)
│  ├─ m6-order-detail.json       M6 — 1 đơn: sản phẩm, ưu đãi, timeline
│  ├─ orders.100rows.csv         100 đơn mẫu, có BOM
│  └─ dataset-summary.json       tổng quan dataset
└─ reference/src/
   ├─ contracts/base.ts                     OrderRow, Money, Delta, Period, Page
   ├─ platform/time.ts                      bucketOf, bucketRange, previousRange
   ├─ platform/reports/filters.ts           parseFilters, toApiQuery, validator
   ├─ platform/reports/series.ts            unit DAY/MONTH/QUARTER, bucket cắt theo khoảng
   ├─ platform/reports/parse.ts             parseIntString, percentToRatio
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
| Đơn vị đếm | **đơn con theo nhà bán** (`parent_order_id IS NOT NULL`) |
| Mốc thời gian | `placed_at`, kỳ `[00:00, 23:59:59]` giờ **UTC+7** |
| Phân trang | `page` **1-based**, `pageSize` ∈ {10, 20, 30} |
| Số trong response | **chuỗi** số nguyên; FE parse ở mapper |
| Phần trăm | BE trả **đã ×100**, 1 chữ số thập phân |
| Đơn hợp lệ | `status <> 'CANCELLED'` |

## Những gì FE đã giả định (cần BE xác nhận)

1. **GMV** = `order_total` (sau ưu đãi, gồm phí ship).
2. **Đơn `NEEDS_RESOLUTION`** vẫn tính vào số đơn.
3. **User mua hàng** = `COUNT(DISTINCT customer_id)`, không cộng dồn giữa các kỳ.
4. **Tỉ lệ khách mới** = khách không có đơn hợp lệ nào trước `startDate`, chia cho số buyer của kỳ.
5. **Kỳ PROVISIONAL** (đang diễn ra): so với đoạn tương ứng của kỳ trước; FE hiện `~`.
6. **M5 — Đơn/user** = số đơn / số user tham gia mua trong kỳ.

## Khi BE xong API

FE chỉ đổi biến môi trường, không sửa UI:

```bash
DATA_SOURCE=api
REPORT_API_BASE_URL=https://...
REPORT_API_TOKEN=...
```

Mỗi slice đã có sẵn `*.http.ts` implement đúng schema. Riêng danh sách đơn (API 2) vẫn trỏ mock
trong `source.ts` — khi có hợp đồng chỉ thay hàm `listOrders`.

## Điểm dễ lệch cần chốt trước khi code

| # | Vấn đề | Ảnh hưởng nếu lệch |
|---|---|---|
| 1 | Số tiền integer hay string | Mapper phải sửa; `"1.145.300"` dễ thành 1.145 thay vì 1,145 tỷ |
| 2 | Timezone của `placed_at` | Trả UTC thì đơn sau 17:00 giờ VN bị lệch sang ngày hôm sau |
| 3 | `page` 1-based hay 0-based | Lệch 1 đơn vị là sai toàn bộ phân trang |
| 4 | Sort mặc định danh sách đơn | FE giả định mới nhất trước |
| 5 | Shape lỗi (4xx/5xx) | FE đọc `message.message` để hiện lỗi tiếng Việt |
