# Hợp đồng dữ liệu FE cần — 5 màn hình

Nguồn chân lý là các file `API_1/6/7/8_Contract.docx` trong `doi_chieu/`.
Tài liệu này chỉ tóm tắt field-level và trỏ tới sample tương ứng.

Base path: `/admin/order-reports` (trừ M6 dùng `/admin/orders`). Auth: Bearer token admin (`super_admin`).

| Màn | Endpoint | Sample |
|---|---|---|
| M1 | `GET /growth` | `m1-growth-report.json` |
| M2 | `GET /growth/period-summary` | `m2-period-summary.json` |
| M2 | `GET` danh sách đơn (API 2) | `m2-orders-page.json` — **mock, chưa có hợp đồng** |
| M4 | `GET /growth/buyers/:customerId/summary` | `m4-buyer-summary.json` |
| M5 | `GET /growth/sellers/:sellerId/summary` | `m5-seller-summary.json` |
| M6 | `GET /admin/orders/:publicId` | `m6-order-detail.json` — **mock, chưa có hợp đồng** |

Query chung: `fromDate`, `toDate` (YYYY-MM-DD, giờ VN), `groupBy` = DAY|WEEK|MONTH|QUARTER|YEAR (API 1, 6).

---

## 1. M1 — `/growth`

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
`growthPercent` là % (FE chia 100 khi vào view model); `orderShare` là %.
`previousValue` của kỳ PROVISIONAL là đoạn tương ứng của kỳ trước.

---

## 2. M2 — `/growth/period-summary`

```jsonc
{
  "period": { "periodKey": "2026-09", "periodLabel": "Tháng 9/2026", "groupBy": "MONTH",
              "startDate": "2026-09-01", "endDate": "2026-09-30", "status": "FINAL" },
  "kpis": {
    "orders": { "value": "557", "previousValue": "527", "growthPercent": 5.7 },
    "gmv": { ... }, "buyers": { ... }, "activeSellers": { ... },
    "aov": "2056195",
    "newBuyers": "33",
    "newBuyerRate": 10.7
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
`newBuyerRate` là %, 1 chữ số thập phân.

### Danh sách đơn của kỳ — API 2 (chưa có hợp đồng)

Sample `m2-orders-page.json` chỉ để FE chạy: `{ items: OrderRow[], total, page, pageSize }`.
Khi BE có hợp đồng API 2, FE chỉ thay `listOrders()`.

---

## 3. M4 — `/growth/buyers/:customerId/summary`

```jsonc
{
  "customer": { "customerId": "11028", "customerName": "Vũ Thảo Nguyên",
                "phoneMasked": "090****481", "province": "Thành phố Cần Thơ",
                "buyerType": "NEW" },      // NEW | RETURNING
  "kpis": {
    "totalOrders": "19",        // gồm cả đơn huỷ
    "validOrders": "16",        // không gồm huỷ
    "cancelledOrders": "3",
    "totalValue": "29184000",   // VND, không gồm huỷ
    "aov": "1824000",
    "completedOrders": "13",
    "completionRate": 68.4,     // % = COMPLETED / totalOrders
    "sellersCount": "8",
    "firstOrderAt": "2026-07-02T09:14:02+07:00",
    "lastOrderAt": "2026-07-31T08:35:33+07:00"
  },
  "series": { "unit": "DAY", "buckets": [{ "key": "2026-07-02", "label": "02/07/2026",
              "shortLabel": "02/07", "startDate": "...", "endDate": "...",
              "orders": "1", "value": "2105000" }] },
  "topSellers": [{ "sellerId": "993", "sellerCode": "SL0000993", "sellerName": "...",
                   "orders": "8", "value": "13412000" }]     // tối đa 5, xếp theo value
}
```

`phoneMasked`: BE che số (giữ 3 đầu + 3 cuối). `province` nullable.
`completionRate` tính trên **totalOrders** (đơn huỷ là không hoàn thành).
`series.unit`: ≤45 ngày → DAY, ≤400 → MONTH, còn lại → QUARTER. **Không có so sánh kỳ trước.**

---

## 4. M5 — `/growth/sellers/:sellerId/summary`

```jsonc
{
  "seller": { "sellerId": "1191", "sellerCode": "SL0001191", "sellerName": "...",
              "mainCategory": "Nhà cửa và Đời sống" },   // nullable
  "kpis": {
    "orders": "2283", "gmv": "1120456000", "buyers": "1781", "aov": "490782",
    "completedOrders": "2009",
    "completionRate": 88.0,      // % = COMPLETED / đơn hợp lệ
    "ordersPerBuyer": 1.28
  },
  "series": { "unit": "DAY", "buckets": [{ "key": "...", "label": "...", "shortLabel": "...",
              "startDate": "...", "endDate": "...", "orders": "76", "gmv": "37412000",
              "buyers": "72" }] }
}
```

`mainCategory` = danh mục nhiều đơn nhất trong khoảng, null khi không có đơn.
`completionRate` tính trên **đơn hợp lệ** (đã loại huỷ) — khác M4.
`ordersPerBuyer` 2 chữ số thập phân. Không có FINAL/PROVISIONAL, không so kỳ trước.

---

## 5. M6 — `/admin/orders/:publicId` (chưa có hợp đồng)

```jsonc
{
  "order": { /* OrderRow */ },
  "product": { "name": "...", "sku": "1254-154", "unitPrice": 1609000, "quantity": 3 },
  "subTotal": 4827000, "shippingFee": 0, "totalDiscount": 193460,
  "total": { "amount": 4633540, "currency": "VND" },
  "timeline": [{ "key": "placed", "label": "Đặt hàng", "at": "...", "tone": "done" }]
}
```

---

## 6. OrderRow — dùng cho API 2 (M2/M4/M5) và M6

```ts
type OrderRow = {
  id: string;
  publicId: string;       // mã hiển thị, dùng cho /orders/:publicId
  placedAt: string;       // ISO 8601 kèm offset
  status: 'PENDING' | 'PREPARING' | 'COMPLETED' | 'CANCELLED' | 'NEEDS_RESOLUTION';
  sellerId: string; sellerCode: string; sellerName: string;
  customerId: string; customerName: string;
  category: string; region: string;
  itemCount: number;
  payment: 'COD' | 'PREPAID';
  discounts: { label: string; amount: number }[];
  total: { amount: number; currency: 'VND' };
};
```

---

## 7. Ba điểm cần chốt

1. **GMV** = `order_total` (sau ưu đãi, gồm ship) hay `sub_total`?
2. **Đơn `NEEDS_RESOLUTION` / RMA hoàn một phần** có tính vào số đơn không?
3. **Timezone** `placed_at`: UTC hay UTC+7? (FE cắt `slice(0,10)` để lấy ngày)

Câu hỏi thêm cho API 2: có trả đơn huỷ không? (ảnh hưởng việc khớp số với `bucket.orders` ở API 7)
