# Báo cáo tăng trưởng — Kế hoạch triển khai FE (bản 2, theo design thật)

> Bản 1 chia việc dựa trên giả định vì chưa đọc được Figma. Bản 2 đọc trực tiếp artifact
> (6 artboard) và thay thế toàn bộ bản 1. Các hạng mục bịa trong bản 1 (doanh thu theo sàn,
> cohort, funnel, new-vs-returning) đã bị loại.

# 1. Kiểm kê artboard

| # | Tiêu đề | Loại | Nội dung |
|---|---|---|---|
| M1 | Báo cáo tăng trưởng | UI hub | 3 tab chỉ số, filter kỳ, 4 KPI, chart cột 12 kỳ, top N nhà bán, panel số liệu theo tháng |
| M2 | Chi tiết kỳ | UI drill-down | 6 KPI, phân bổ đơn theo ngày, 3 series toggle, bảng đơn 13 cột có search/filter/paging |
| M3 | Đặc tả số liệu | Tài liệu | Công thức từng chỉ số, quy ước đếm, 5 endpoint đề xuất, 5 điểm cần chốt |
| M4 | Chi tiết đơn hàng theo user | UI drill-down | 6 KPI user, giá trị mua theo tháng, top nhà bán của user, bảng đơn của user |
| M5 | Thống kê nhà bán | UI drill-down | 6 KPI nhà bán, chart 3 series theo tháng, bảng đơn của nhà bán |
| M6 | Thông tin đơn hàng | UI chi tiết | Sản phẩm, breakdown ưu đãi, tổng đơn, timeline vận chuyển |

M3 là **hợp đồng dữ liệu**, không phải màn hình. Mọi công thức và endpoint lấy từ M3.

# 2. Phân công

| Owner | Màn hình | Route | Feature folder | Est |
|---|---|---|---|---|
| Chinh (FE-A) | M1 + platform | `/growth` | `src/features/growth-overview` + `src/platform/**` | L |
| Long (FE-B) | M2, M6 | `/growth/period`, `/orders/[orderId]` | `src/features/period-detail`, `src/features/order-detail` | L |
| Phuc (FE-C) | M4, M5 | `/growth/customers/[customerId]`, `/growth/sellers/[sellerId]` | `src/features/buyer-detail`, `src/features/seller-detail` | L |

Nguyên tắc: chia theo **màn hình**, mỗi file một owner, hub thuộc người giữ platform.

# 3. Route tree

```
app/(admin)/
├─ layout.tsx                                  FE-A  sidebar + topbar + breadcrumb
└─ growth/
   ├─ page.tsx                                 FE-A  M1 hub (3 tab qua ?tab=)
   ├─ loading.tsx / error.tsx                  FE-A
   ├─ period/page.tsx                          FE-B  M2
   ├─ customers/[customerId]/page.tsx          FE-C  M4
   └─ sellers/[sellerId]/page.tsx              FE-C  M5
app/(admin)/orders/[orderId]/page.tsx          FE-B  M6
app/api/exports/
├─ growth/route.ts                             FE-A
├─ period/route.ts                             FE-B
├─ customer/[customerId]/route.ts              FE-C
└─ seller/[sellerId]/route.ts                  FE-C
```

Mỗi route có `loading.tsx` và `error.tsx` riêng. Export nhận `?format=csv|xlsx|pdf`; giai đoạn này chỉ CSV chạy, hai format còn lại trả 501 kèm TODO.

# 4. Hợp đồng dữ liệu

Ring 0 — FE-A sở hữu, chỉ thêm:

```ts
export type IsoDate = string;                  // 'YYYY-MM-DD'
export type IsoDateTime = string;
export type Money = { amount: number; currency: 'VND' };
export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'COMPLETED' | 'CANCELLED' | 'NEEDS_RESOLUTION';
export type Delta = { value: number; pct: number | null; direction: 'up' | 'down' | 'flat' };
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

/** Một dòng đơn con — dùng chung cho M2, M4, M5 */
export type OrderRow = {
  id: string; publicId: string; placedAt: IsoDateTime;
  status: OrderStatus;
  sellerId: string; sellerCode: string; sellerName: string;
  customerId: string; customerName: string;
  category: string; region: string;
  itemCount: number; payment: 'COD' | 'PREPAID';
  discounts: { label: string; amount: number }[];
  total: Money;
};
```

Mỗi slice khai báo `<X>Source` trong `contracts.ts` của mình, method khớp 1-1 endpoint ở Mục 5.

# 5. API (lấy từ M3, đánh dấu Đề xuất)

| Method | Path | Query | Response | Owner |
|---|---|---|---|---|
| GET | `/admin/order-reports/growth` | metric, period, dateFrom, dateTo, topN | chuỗi theo mốc + 4 KPI + topUsersByOrders/Value + topSellers | FE-A |
| GET | `/admin/order-reports/growth/period` | dateFrom, dateTo, tab=orders\|buyers\|sellers, page, pageSize | KPI kỳ, phân bổ trong kỳ, danh sách theo tab | FE-B |
| GET | `/admin/order-reports/growth/customers/:customerId` | dateFrom, dateTo | KPI user, chuỗi giá trị mua, top nhà bán, danh sách đơn | FE-C |
| GET | `/admin/order-reports/growth/sellers/:sellerId` | dateFrom, dateTo, bucket | KPI nhà bán, chuỗi theo mốc, danh sách đơn theo mốc | FE-C |
| GET | `/admin/orders/:publicId` | — | thông tin đơn, ưu đãi, tiến trình | FE-B |

Ba endpoint đầu và hai cuối đều là **Đề xuất** — BE chưa có, FE chạy mock theo đúng shape.

# 6. Định nghĩa chỉ số (nguồn: M3)

| Chỉ số | Công thức |
|---|---|
| Đơn vị đếm | đơn con: `o.parent_order_id IS NOT NULL` |
| Đơn hợp lệ | `o.status <> 'CANCELLED'` và chưa hoàn toàn phần |
| Tổng đơn | `COUNT(o.id)` trong kỳ, cùng điều kiện trên |
| GMV | `SUM(o.order_total)` — sau ưu đãi, gồm phí ship |
| User mua hàng | `COUNT(DISTINCT o.customer_id)` — **không cộng dồn** từ ngày lên tháng |
| Nhà bán có đơn | `COUNT(DISTINCT o.seller_id)` |
| AOV | `GMV / Tổng đơn` |
| Tăng trưởng | `(X_kỳ − X_kỳ_trước) / X_kỳ_trước`; ẩn % khi kỳ trước = 0 |
| Kỳ đang diễn ra | hiển thị tạm tính; % dùng dự phóng `X × số_ngày_kỳ / số_ngày_đã_qua` |
| Tỉ lệ khách mới | `COUNT(khách có MIN(placed_at) trong kỳ) / User mua hàng` |

Mốc thời gian: `placed_at`, kỳ `[00:00, 23:59:59]` theo UTC+7.

# 7. Màn M1 — Báo cáo tăng trưởng

| Vùng | Nội dung |
|---|---|
| Sidebar | Dashboard · B2C (9 báo cáo) · Thương Hiệu · Thẻ Sành · Bộ Sưu Tập · Danh Mục · Hỗ trợ người dùng |
| Breadcrumb | Báo cáo B2C / Báo cáo tăng trưởng |
| Action bar | Xuất CSV · Xuất XLSX · Xuất PDF |
| Tab chỉ số | Chỉ số tăng trưởng · Đơn hàng · User mua hàng |
| Filter | Xem theo: Ngày/Tuần/Tháng/Quý/Năm · Từ ngày · Đến ngày · nhãn "12 tháng gần nhất · 12 kỳ" |
| KPI | Đơn hàng 97.612 (+8,0%) · User mua hàng 68.481 (+11,9%) · GMV 40,90 tỷ (+10,4%) · Nhà bán có đơn 1.179 (+9,9%) |
| Chart | "Tăng trưởng đơn hàng theo tháng" — cột 12 kỳ, nhãn % trên từng cột, kỳ cuối gắn nhãn "tạm tính", tooltip chọn được user/nhà bán, click cột → M2 |
| Bảng | Top 3/5/10 nhà bán theo số đơn: # · Mã NB · Tên NB · Danh mục · Số đơn · Tỉ trọng đơn · GMV · Tăng trưởng đơn; link "Xem tất cả 1.179 nhà bán" |
| Panel | "Số liệu theo tháng" 12 kỳ, nút Mở rộng |

# 8. Các màn còn lại

**M2 — Chi tiết kỳ**: 6 KPI (Tổng đơn, GMV, User mua, Nhà bán có đơn, AOV, Tỉ lệ khách mới) · chart "Phân bổ đơn hàng theo ngày" + "Cao nhất: Ngày 9 · 5.932 đơn" · toggle 3 series (Đơn/User/Nhà bán) · bảng đơn 13 cột (STT, Mã đơn, Ngày đặt, Mã NB, Tên NB, Mã KH, Khách hàng, Danh mục, Khu vực, Giá trị đơn, Ưu đãi, Thanh toán, Trạng thái) · search · filter trạng thái · page size 10/20/30.

**M4 — Chi tiết user**: 6 KPI (Số đơn, Tổng giá trị mua, AOV, Tỉ lệ hoàn thành, Nhà bán đã mua, Đơn gần nhất) · "Giá trị mua theo tháng" · Top 5 nhà bán của user · bảng đơn 11 cột.

**M5 — Thống kê nhà bán**: 6 KPI (Số đơn bán ra, GMV, User tham gia mua, AOV, Tỉ lệ hoàn thành, Đơn/user) · chart 3 series theo tháng · chọn mốc để lọc đơn · bảng đơn 12 cột + "Xem đơn".

**M6 — Thông tin đơn hàng**: header trạng thái · khách hàng · nhà bán · thanh toán · ngày đặt · sản phẩm (SKU, SL, đơn giá) · breakdown ưu đãi (Thẻ Sành, voucher shop, voucher sàn, hỗ trợ ship) · tạm tính, phí ship, tổng ưu đãi, tổng đơn · timeline 5 mốc, đoạn nối tô cam khi hai mốc liền kề đều có giá trị.

Quy tắc ưu đãi (M3): Tổng ưu đãi = product + seller + platform + shipping, **không** cộng thêm Thẻ Sành (đã nằm trong product).

# 9. Git, CI, chất lượng

Giữ nguyên hạ tầng đã dựng: CI `verify` (typecheck + lint boundaries + test + build), deploy sau CI, branch protection 1 approval, CODEOWNERS theo route/feature folder.

Quy tắc: một file một owner · không import chéo `features/*` · type dùng chung nằm ở `src/contracts` · PR ≤ 400 dòng · rebase `main` trước khi mở PR.

# 10. Việc theo owner

## Chinh (FE-A)
- [ ] `app/(admin)/layout.tsx`: sidebar 7 nhóm, breadcrumb, topbar
- [ ] `growth/page.tsx`: 3 tab qua `?tab=`, filter kỳ, 4 KPI, chart cột + nhãn %, panel 12 kỳ
- [ ] `features/growth-overview`: contracts, fixture, mock, mapper, http, queries, components
- [ ] `OrderRow` + `Period` + `Money` trong `src/contracts`
- [ ] Export CSV; XLSX/PDF trả 501 kèm TODO
- [ ] Giữ: `parseFilters`, UI kit, `reportFetch`, `toCsv`, tag

## Long (FE-B)
- [ ] `growth/period/page.tsx`: 6 KPI, phân bổ theo ngày, 3 series, bảng 13 cột + paging
- [ ] `features/period-detail`: Source khớp `/growth/period`
- [ ] `orders/[orderId]/page.tsx` + `features/order-detail`: breakdown ưu đãi, timeline
- [ ] Export CSV cho period

## Phuc (FE-C)
- [ ] `growth/customers/[customerId]/page.tsx` + `features/buyer-detail`
- [ ] `growth/sellers/[sellerId]/page.tsx` + `features/seller-detail`
- [ ] Chart + top 5 nhà bán của user; chart 3 series của nhà bán; lọc đơn theo mốc
- [ ] Export CSV cho cả hai màn

# 11. Câu hỏi cần chốt (từ mục 7 của M3)

1. GMV hiển thị là `order_total` (sau ưu đãi, gồm ship) hay `sub_total` (trước ưu đãi)? Cần thống nhất với báo cáo đối soát.
2. Đơn `NEEDS_RESOLUTION` và RMA hoàn một phần có tính vào số đơn không?
3. Múi giờ khi gom `aggregation_order`: giờ server hay UTC+7?
4. Ý nghĩa `total_direct_discount` với đơn mới (hiện chỉ có công thức cho đơn cũ).
5. Cột `is_stackable` trong `promotion_rule` có dùng ở checkout không?

# 12. Ghi chú kỹ thuật

- Dữ liệu mock sinh từ một dataset deterministic dùng chung ở `src/platform/mock/`, để 3 màn không lệch số với nhau.
- Bảng đơn ở M2/M4/M5 dùng cùng `OrderRow`, mỗi màn tự khai báo cột của mình.
- Không dùng Parallel Routes nữa: mỗi màn là một route riêng, ranh giới sở hữu nằm ở folder route.
