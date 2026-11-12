# Hợp đồng dữ liệu FE cần — 5 màn hình, 8 API

Nguồn chân lý là các file `API_1..8_Contract.docx` trong `doi_chieu/`.
Tài liệu này tóm tắt field-level và trỏ tới sample tương ứng.

Base path: `/admin/order-reports` (trừ API 5 dùng `/admin/orders`). Auth: Bearer token admin (`super_admin`).

| Màn | API | Endpoint | Sample |
|---|---|---|---|
| M1 | API 1 | `GET /growth` | `m1-growth-report.json` |
| M2 | API 6 | `GET /growth/period-summary` | `m2-period-summary.json` |
| M2 | API 2 | `GET /growth/orders?scope=PERIOD` | `m2-orders-page.json` |
| M2 | API 3 | `GET /growth/buyers` | `m2-period-buyers.json` |
| M2 | API 4 | `GET /growth/sellers` | `m2-period-sellers.json` |
| M4 | API 8 | `GET /growth/buyers/:customerId/summary` | `m4-buyer-summary.json` |
| M4 | API 2 | `GET /growth/orders?scope=CUSTOMER` | `m4-orders-page.json` |
| M5 | API 7 | `GET /growth/sellers/:sellerId/summary` | `m5-seller-summary.json` |
| M5 | API 2 | `GET /growth/orders?scope=SELLER` | `m5-orders-page.json` |
| M6 | API 5 | `GET /admin/orders/:publicId?view=growthDrawer` | `m6-order-detail.json` |

Query chung cho API 1/6/7/8: `fromDate`, `toDate` (YYYY-MM-DD, giờ VN), `groupBy` = DAY|WEEK|MONTH|QUARTER|YEAR.
URL công khai của FE vẫn là `?from&to&period`; FE đổi tên ở đúng một hàm `toApiQuery`.

---

## 1. M1 — API 1 `/growth`

```jsonc
{
  "meta": { "startDate": "...", "endDate": "...", "groupBy": "MONTH", "totalPeriods": 12 },
  "periods": [{
    "periodKey": "2026-10", "periodLabel": "Tháng 10/2026",
    "startDate": "2026-10-01", "endDate": "2026-10-31",
    "status": "FINAL",                       // PROVISIONAL khi endDate >= hôm nay
    "orders":  { "value": "94277", "previousValue": "85011", "growthPercent": 10.9 },
    "buyers":  { ... }, "gmv": { ... }, "activeSellers": { ... },
    "aov": "435021",
    "topBuyersByOrders": [{ "customerId": "4732", "customerName": "Đỗ Hải Yến", "orders": "18", "value": "20800000" }],
    "topBuyersByValue":  [ ... ],
    "topSellersByOrders":[{ "sellerId": "1191", "sellerCode": "SL0001191", "sellerName": "...",
                            "category": "...", "orders": "3291", "gmv": "1560000000",
                            "orderShare": 3.5, "growthPercent": 11.3 }]
  }]
}
```

FE dùng: 4 thẻ KPI lấy kỳ **FINAL cuối** (nếu chỉ có PROVISIONAL thì lấy kỳ đó + `~`);
`growthPercent`/`orderShare` là % (FE chia 100 khi vào view model).
`previousValue` của kỳ PROVISIONAL là đoạn tương ứng của kỳ trước.
Kỳ đầu tiên trong khoảng vẫn có `previousValue` (BE lùi thêm 1 kỳ).

---

## 2. M2 — API 6 `/growth/period-summary`

```jsonc
{
  "period": { "periodKey": "2026-09", "periodLabel": "Tháng 9/2026", "groupBy": "MONTH",
              "startDate": "2026-09-01", "endDate": "2026-09-30", "status": "FINAL" },
  "kpis": {
    "orders": { "value": "557", "previousValue": "527", "growthPercent": 5.7 },
    "gmv": { ... }, "buyers": { ... }, "activeSellers": { ... },
    "aov": "2056195", "newBuyers": "33", "newBuyerRate": 10.7
  },
  "distribution": {
    "unit": "DAY",                    // DAY→HOUR, WEEK→WEEKDAY, MONTH→DAY, QUARTER→WEEK, YEAR→MONTH
    "buckets": [{ "key": "2026-09-01", "label": "Ngày 1", "shortLabel": "1",
                  "orders": "15", "isFuture": false }],
    "peak": { ... }                   // null khi kỳ không có đơn
  }
}
```

Ràng buộc: `fromDate`/`toDate` phải **cùng một kỳ** `groupBy`; `toDate` được sau hôm nay.
`newBuyerRate` là %, 1 chữ số thập phân. Khoá WEEK dùng ISO weekYear (`2026-W44`).

---

## 3. API 2 — `/growth/orders` (một endpoint cho 3 màn)

| Query | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `scope` | PERIOD \| CUSTOMER \| SELLER | Có | |
| `groupBy` + `periodKey` | enum / string | PERIOD | Không gửi fromDate/toDate |
| `fromDate` + `toDate` | YYYY-MM-DD | CUSTOMER, SELLER | |
| `customerId` / `sellerId` | string | theo scope | |
| `bucketGroupBy` + `bucketPeriodKey` | enum / string | Không | SELLER: lọc theo mốc chart, gửi đủ cặp |
| `q` | string ≤100 | Không | PERIOD: mã đơn, mã/tên khách, mã/tên nhà bán. CUSTOMER: mã đơn, nhà bán. SELLER: mã đơn, tên khách, SĐT |
| `status` | ALL \| PENDING_PROCESSING \| PREPARING_SHIPMENT \| COMPLETED \| CANCELLED \| NEEDS_RESOLUTION | Không | Mặc định ALL |
| `page` | int | Không | 1-based, ≤ 10.000 |
| `pageSize` | int | Không | 10 \| 20 \| 50 \| 100 |

Response:

```jsonc
{
  "meta": {
    "scope": "SELLER", "groupBy": null, "periodKey": null,
    "customerId": null, "sellerId": "seller-1",
    "startDate": "2025-11-01", "endDate": "2026-10-27",
    "listStartDate": "2026-10-01", "listEndDate": "2026-10-31",  // phần giao với bucket
    "bucketGroupBy": "MONTH", "bucketPeriodKey": "2026-10",
    "periodStatus": "FINAL", "timezone": "Asia/Ho_Chi_Minh", "dataAsOf": "..."
  },
  "pagination": { "page": 1, "pageSize": 20, "totalItems": 128, "totalPages": 7 },
  "items": [{
    "orderPublicId": "26091202004582KQ7A",
    "orderNumber": "OD-2609120200",
    "placedAt": "2026-09-12T07:22:10.000Z",       // ISO UTC
    "sellerId": "seller-1", "sellerCode": "SL0001201", "sellerName": "...",   // nullable
    "customerId": "customer-105", "customerName": "...",                     // nullable
    "primaryCategoryName": "...",                  // nullable
    "itemQuantity": 2,
    "regionName": "Thành phố Hồ Chí Minh",         // nullable
    "orderTotalVnd": "742000",                     // chuỗi
    "discountBadges": ["SANH", "SELLER_VOUCHER", "SHIPPING_SUPPORT"],
    "paymentMethod": "COD",                        // COD | NO_CASH | REFUND | null
    "paymentStatus": "success",                    // waiting | success | failed | null
    "status": "COMPLETED",
    "sourceStatus": "DELIVERED",
    "state": "SHIPPED"                             // nullable
  }]
}
```

- Badge ưu đãi giữ thứ tự SANH, PRODUCT_DISCOUNT, SELLER_VOUCHER, PLATFORM_VOUCHER, SHIPPING_SUPPORT; **không kèm số tiền**.
- "Thanh toán trước" chỉ khi `paymentMethod=NO_CASH` **và** `paymentStatus=success`; null → "—".
- STT do FE tính `(page-1)*pageSize + vị trí + 1` (API không trả STT, không trả id nội bộ).
- Bảng không có cột SĐT (API 2 không trả SĐT).
- Đổi `q`, `status`, `pageSize`, `bucket` → FE về `page=1`.

---

## 4. API 3 — `/growth/buyers` (tab User mua hàng)

Query: `groupBy`, `periodKey` (bắt buộc), `sortBy` = ORDER_COUNT (mặc định) | TOTAL_VALUE,
`q` (mã khách prefix, tên, SĐT), `page`, `pageSize` ∈ 10/20/30.

```jsonc
{
  "meta": { "groupBy": "MONTH", "periodKey": "2026-09", "startDate": "2026-09-01",
            "endDate": "2026-09-30", "periodStatus": "FINAL",
            "timezone": "Asia/Ho_Chi_Minh", "dataAsOf": "...", "sortBy": "ORDER_COUNT" },
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 236, "totalPages": 24 },
  "items": [{
    "customerId": "customer-105", "customerName": "Đỗ Thảo Mai", "maskedPhone": "091****248",
    "orderCount": "5", "totalValueVnd": "19042950", "aovVnd": "3808590",
    "regionName": "Thành phố Hà Nội", "classification": "NEW",   // NEW | RETURNING
    "lastOrderAt": "2026-09-30T15:15:14.000Z"
  }]
}
```

- Badge tab = `pagination.totalItems` của lần tải đầu `q` rỗng; "Kết quả" = `totalItems` request hiện tại.
- `sortBy` không làm đổi `totalItems`. Đổi `q`/`sortBy`/`pageSize` → `page=1`.
- Chỉ trả SĐT đã mask; không trả số gốc.

---

## 5. API 4 — `/growth/sellers` (tab Nhà bán)

Query: `groupBy`, `periodKey`, `q` (mã prefix / tên), `page`, `pageSize` ∈ 10/20/30.
Không có `sortBy` — xếp cố định theo GMV giảm dần.

```jsonc
{
  "meta": { "groupBy": "MONTH", "periodKey": "2026-09", "startDate": "...", "endDate": "...",
            "periodStatus": "FINAL", "timezone": "Asia/Ho_Chi_Minh", "dataAsOf": "..." },
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 57, "totalPages": 6 },
  "items": [{
    "sellerId": "seller-53", "sellerCode": "SL0001364", "sellerName": "...",
    "primaryCategoryName": "Sở thích & sưu tầm",   // nullable
    "orderCount": "204", "gmvVnd": "41662030", "buyerCount": "183",
    "gmvSharePercent": 12.5                        // % đã ×100, null khi periodGMV = 0
  }]
}
```

`gmvSharePercent` giữ mẫu số periodGMV ngay cả khi `q` lọc → tổng các dòng không cần bằng 100%.

---

## 6. M4 — API 8 `/growth/buyers/:customerId/summary`

```jsonc
{
  "customer": { "customerId": "customer-105", "customerName": "Vũ Thảo Nguyên",
                "phoneMasked": "090****481", "province": "Thành phố Cần Thơ",
                "buyerType": "NEW" },
  "kpis": {
    "totalOrders": "19", "validOrders": "16", "cancelledOrders": "3",
    "totalValue": "29184000", "aov": "1824000", "completedOrders": "13",
    "completionRate": 68.4, "sellersCount": "8",
    "firstOrderAt": "2026-07-02T09:14:02+07:00", "lastOrderAt": "2026-07-31T08:35:33+07:00"
  },
  "series": { "unit": "DAY", "buckets": [{ "key": "...", "label": "...", "shortLabel": "...",
              "startDate": "...", "endDate": "...", "orders": "1", "value": "2105000" }] },
  "topSellers": [{ "sellerId": "993", "sellerCode": "SL0000993", "sellerName": "...",
                   "orders": "8", "value": "13412000" }]
}
```

`completionRate` tính trên **totalOrders** (đơn huỷ là không hoàn thành). Không so kỳ trước.

---

## 7. M5 — API 7 `/growth/sellers/:sellerId/summary`

```jsonc
{
  "seller": { "sellerId": "seller-1", "sellerCode": "SL0000001", "sellerName": "...",
              "mainCategory": "Nhà cửa và Đời sống" },
  "kpis": { "orders": "2283", "gmv": "1120456000", "buyers": "1781", "aov": "490782",
            "completedOrders": "2009", "completionRate": 88.0, "ordersPerBuyer": 1.28 },
  "series": { "unit": "MONTH", "buckets": [{ "key": "2026-09", "label": "...", "shortLabel": "...",
              "startDate": "...", "endDate": "...", "orders": "76", "gmv": "37412000",
              "buyers": "72" }] }
}
```

`mainCategory` = danh mục nhiều đơn nhất (khác quy tắc API 4). `completionRate` tính trên đơn hợp lệ.
`series.unit`: ≤45 ngày → DAY, ≤400 → MONTH, còn lại → QUARTER.

---

## 8. M6 — API 5 `/admin/orders/:publicId?view=growthDrawer`

```jsonc
{
  "orderPublicId": "26091202004582KQ7A",
  "status": "COMPLETED", "state": "SHIPPED",
  "hasSanhBenefit": true,
  "customer": { "customerId": "customer-105", "customerName": "...", "maskedPhone": "091****482" },
  "seller": { "sellerId": "seller-1", "sellerCode": "SL0001201", "sellerName": "..." },
  "regionName": "Thành phố Hồ Chí Minh",
  "payment": { "method": "COD", "status": "success" },
  "placedAt": "2026-09-12T07:22:10.000Z",
  "items": [{ "itemId": 42, "productName": "...", "sku": "1201-192", "quantity": 1,
              "unitPriceVnd": "827000", "lineSubtotalVnd": "827000" }],
  "discountBreakdown": [{
    "kind": "SANH", "labelKey": "SANH_DISCOUNT", "amountVnd": "61000",
    "includedIn": "PRODUCT", "fundedBy": "PLATFORM",
    "sellerFundedVnd": null, "platformFundedVnd": null
  }],
  "totals": { "subtotalVnd": "827000", "shippingFeeVnd": "25000",
              "totalDiscountVnd": "110000", "orderTotalVnd": "742000" },
  "delivery": {
    "carrierName": "Viettel Post", "trackingCode": null, "timelineIntegrity": "INCOMPLETE",
    "milestones": [
      { "code": "PLACED", "occurredAt": "2026-09-12T07:22:10Z", "source": "ORDER" },
      { "code": "PACKED", "occurredAt": null, "source": null }
    ]
  },
  "dataQualityFlags": ["PACKED_TIMESTAMP_UNAVAILABLE"]
}
```

- `milestones` đúng thứ tự PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED; `occurredAt=null` khi chưa có thời gian thật.
  PACKED thường null vì `packed_at` hiện là bản sao `confirmed_at`.
- `CANCELLED`/`RETURNED` chỉ thêm khi có timestamp thật.
- FE **không** cộng lại `totalDiscountVnd`/`orderTotalVnd`; hiển thị đúng số BE trả.
- FE hiển thị `timelineIntegrity` và `dataQualityFlags` dạng ghi chú, không sửa số.
- Lỗi: 404 → 404 page; 422 (đơn cha) → EmptyState với message; 400/500 → EmptyState với `message.message`.

---

## 9. Điểm cần BE chốt

1. **Tab Đơn hàng** ở Chi tiết kỳ lấy `kpis.orders` (API 6) hay `totalItems status=ALL` (API 2)?
   FE đang theo API 6.
2. **Danh mục chính**: theo số đơn (API 1/7) hay theo doanh số dòng hàng (API 2/4)?
   FE đang dùng `primaryCategoryName` cho bảng, `mainCategory` cho header nhà bán.
3. **pageSize**: giữ 2 bộ (10/20/50/100 cho API 2; 10/20/30 cho API 3/4) hay thống nhất?
4. **Lọc mốc nhà bán**: có loại đơn huỷ cho khớp `bucket.orders` không? FE đang giữ `status=ALL`.
5. **Tên field khách**: `maskedPhone`/`regionName` (API 3/5) vs `phoneMasked`/`province` (API 8) — FE map riêng.
6. **GMV** = `order_total` (sau ưu đãi, gồm ship) — cần mentor xác nhận.
