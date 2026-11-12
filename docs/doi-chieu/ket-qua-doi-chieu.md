# Kết quả đồng bộ FE với bộ hợp đồng API 1–8

Cập nhật: 12/11/2026 · nguồn: `doi_chieu/doi-chieu-FE-vs-API1-8-2026-11-12.xlsx`.
Trạng thái dùng: **Xong** · **Chờ BE** · **Không áp dụng**.

## Tổng hợp

| Nhóm việc | Tổng | Xong | Chờ BE | Không áp dụng |
|---|---:|---:|---:|---:|
| API 2–5 (mới) | 28 | 28 | 0 | 0 |
| Lỗi luồng & mock (N1–N15) | 15 | 15 | 0 | 0 |
| API 1/6/7/8 — dòng còn mở | 13 | 13 | 0 | 0 |
| **Tổng** | **56** | **56** | **0** | **0** |

> 6 mâu thuẫn giữa các hợp đồng và 10 câu hỏi cho BE vẫn mở. FE đã chạy theo **quyết định mặc
> định** ghi ở cuối tài liệu; khi BE chốt khác thì chỉ sửa đúng một chỗ trong mapper/nhãn.

Theo phase: P7 (15 dòng N) · P8 (API 2: 13 dòng) · P9 (API 3/4: 8 dòng) · P10 (API 5: 6 dòng) · P11 (luồng cũ).

## A. API 2–5 (28 dòng)

| # | API | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 1 | API 2 | Một endpoint `GET /growth/orders` cho 3 scope | Xong | `platform/reports/orders/` dùng chung |
| 2 | API 2 | PERIOD gửi `groupBy` + `periodKey` | Xong | Không gửi fromDate/toDate |
| 3 | API 2 | SELLER lọc theo mốc: `bucketGroupBy` + `bucketPeriodKey` | Xong | URL đổi sang `?bucket=<key>`, unit lấy từ series |
| 4 | API 2 | pageSize 10/20/50/100 | Xong | `parsePageSize` chặn giá trị ngoài bộ |
| 5 | API 2 | Enum trạng thái mới | Xong | `PENDING_PROCESSING`/`PREPARING_SHIPMENT` + `state` |
| 6 | API 2 | `GrowthOrderRow` mới (không có id) | Xong | STT tính theo vị trí dòng |
| 7 | API 2 | Nhãn thanh toán theo cặp method/status | Xong | "Thanh toán trước" chỉ NO_CASH + success |
| 8 | API 2 | Badge ưu đãi, không kèm tiền | Xong | Đúng thứ tự hợp đồng |
| 9 | API 2 | q + status cho trang user/nhà bán | Xong | Đổi filter → page=1 |
| 10 | API 2 | Phạm vi tìm kiếm ở Chi tiết kỳ | Xong | Mã đơn, mã/tên khách, mã/tên nhà bán; q ≤ 100 |
| 11 | API 2 | Phân trang `pagination` + page ≤ 10.000 | Xong | `toOrderPage` cho page cũ |
| 12 | API 2 | Cột theo scope | Xong | period/buyer/seller |
| 13 | API 2 | Mã KH trong bảng | Xong | Bỏ cắt `customer-`; mock dùng `customer-N`, BE trả id thật |
| 14 | API 3 | Tab User mua hàng | Xong | Module `period-buyers` + bảng 8 cột |
| 15 | API 3 | Sắp xếp ORDER_COUNT/TOTAL_VALUE trên URL | Xong | Đổi sort → page=1 |
| 16 | API 3 | Cột bảng theo hợp đồng | Xong | Tên (link), SĐT mask, số đơn, tổng, AOV, khu vực, phân loại, đơn gần nhất |
| 17 | API 3 | pageSize 10/20/30 + badge/Kết quả | Xong | Badge = lần tải đầu q rỗng |
| 18 | API 3 | Link sang Chi tiết user | Xong | Kèm `from=startDate&to=min(endDate,hôm nay)` |
| 19 | API 4 | Tab Nhà bán | Xong | Module `period-sellers` + bảng 7 cột |
| 20 | API 4 | Cột bảng + thanh tỷ trọng | Xong | `gmvSharePercent` null → "—"; xếp cố định theo GMV |
| 21 | API 4 | q + pageSize 10/20/30 | Xong | Mã prefix / tên |
| 22 | API 4 | Link sang Chi tiết nhà bán | Xong | Kèm from/to đã kẹp hôm nay |
| 23 | API 5 | Endpoint `view=growthDrawer` | Xong | `order.http.ts` + zod |
| 24 | API 5 | Drawer bằng intercepting route | Xong | `app/(admin)/@drawer/(.)orders/[orderId]`; giữ trang `/orders/[id]` |
| 25 | API 5 | Shape mới: items[], discountBreakdown[], delivery | Xong | Viết lại contracts/schema/mapper |
| 26 | API 5 | Không tự cộng totalDiscount/total | Xong | Dùng đúng số BE trả |
| 27 | API 5 | Milestones có thể null + timelineIntegrity | Xong | PACKED luôn null; không vẽ như đã xong |
| 28 | API 5 | 404/422 + dataQualityFlags | Xong | 404 → notFound; 422 → EmptyState |

## B. Lỗi luồng & mock (15 dòng)

| Mã | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|
| N1 | Bắt `ReportApiError` → EmptyState(message BE) | Xong | Áp cho growth/period/seller/buyer + order |
| N2 | 404 của API 7/8 → `null` | Xong | `seller.http`/`buyer.http` catch `ReportNotFoundError` |
| N3 | "Quay lại biểu đồ" giữ bộ lọc gốc | Xong | `backFrom/backTo/backPeriod`, fallback kẹp hôm nay |
| N4 | Helper `clampToToday` | Xong | Dùng cho mọi link API 7/8 |
| N5 | Cache key gồm chế độ dữ liệu | Xong | `dataMode()` trong 6 `unstable_cache` |
| N6 | Khoá tuần theo ISO | Xong | `isoWeekKey`/`mondayOfIsoWeek`; hết "Tuần NaN" |
| N7 | `isFuture` theo giờ VN | Xong | `currentHourIn(tz)` |
| N8 | `MOCK_NOW` cho chế độ mock | Xong | `2026-10-27T14:45+07:00`, đặt `off` để dùng giờ thật |
| N9 | Route export kiểm tra khoảng → 400 | Xong | 4 route |
| N10 | Ẩn bộ lọc ngày ở Chi tiết kỳ | Xong | Hợp đồng không có ô ngày |
| N11 | `encodeURIComponent` id trong path | Xong | seller/buyer/order |
| N12 | Ngày hiển thị dd/mm/yyyy | Xong | Bảng số liệu + trang user |
| N13 | Mock đi qua schema zod | Xong | 4 slice + 3 module API 2/3/4 + API 5 |
| N14 | Nhãn kỳ tiếng Việt ở phụ đề | Xong | `GROUP_BY_LABEL` chuyển lên platform |
| N15 | Giờ theo Asia/Ho_Chi_Minh | Xong | `formatDateTime` → `dd/MM/yyyy HH:mm:ss` |

## C. API 1/6/7/8 — 13 dòng còn mở

| # | API | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 6 | API 1 | Khoá và nhãn kỳ (tuần "NaN") | Xong | N6 |
| 7 | API 1 | Kỳ so sánh của kỳ đầu tiên | Xong | `previousWindow` lùi 1 bucket |
| 9 | API 1 | Top nhà bán theo mốc đang chọn | Xong | State chung trong `GrowthHub` |
| 10 | API 1 | Top user mua trong panel kỳ | Xong | Panel 3 danh sách, nút Top 3/5/10 |
| 11 | API 1 | Nhãn % dưới mốc + điểm PROVISIONAL | Xong | LabelList + dot amber |
| 13 | API 1 | Panel kỳ (4 chỉ số + 3 top + nút) | Xong | Ghim khi bấm mốc; "Chi tiết kỳ →" |
| 20 | Chung | 404 không ra notFound() | Xong | N2 + N1 |
| 33 | API 6 | Distribution WEEK/QUARTER + HOUR | Xong | N6/N7 |
| 35 | API 6 | 3 tab Đơn hàng/User mua/Nhà bán | Xong | API 2/3/4 |
| 36 | API 6 | Link từ tab sang chi tiết | Xong | from/to kẹp hôm nay |
| 45 | API 7 | Chặn bấm mốc 0 đơn | Xong | `bucket.orders > 0` |
| 59 | API 7 | Link nhà bán dùng bộ lọc tổng quan | Xong | `clampToToday` |
| 60 | API 8 | Link user dùng bộ lọc tổng quan | Xong | `clampToToday` |

## D. 6 mâu thuẫn hợp đồng — FE đang theo mặc định nào

| # | Chủ đề | FE đang làm | Chờ BE chốt |
|---|---|---|---|
| 1 | Số trên tab Đơn hàng | Badge = `kpis.orders` (API 6); "Kết quả" = `totalItems` (API 2) | Chốt một nguồn |
| 2 | Số đơn khi bấm mốc nhà bán | Giữ `status=ALL` (gồm huỷ), ghi chú dưới bảng | Có loại đơn huỷ không |
| 3 | Tập pageSize | Tách bộ: 10/20/50/100 (API 2), 10/20/30 (API 3/4) | Có thống nhất không |
| 4 | Danh mục chính | Bảng dùng `primaryCategoryName` (API 2/4); header nhà bán dùng `mainCategory` (API 7) | Chốt một quy tắc |
| 5 | Tên field khách | View model thống nhất `maskedPhone`/`regionName`; mapper đổi từ API 8 | Đồng nhất bản sau |
| 6 | SĐT trong danh sách đơn | Không thêm cột SĐT vào bảng đơn (API 2 không trả) | Ghi chú |

## E. 10 câu cần trả lời

| # | Hỏi | Câu hỏi | FE đang làm |
|---|---|---|---|
| 1 | BE | Tab Đơn hàng lấy `kpis.orders` (API 6) hay `totalItems status=ALL` (API 2)? | API 6 |
| 2 | BE | Danh mục chính theo số đơn hay doanh số dòng hàng? | Theo từng API như bảng D4 |
| 3 | BE | Có thống nhất pageSize giữa API 2 và API 3/4? | Tách bộ |
| 4 | BE | Lọc mốc nhà bán có loại đơn huỷ? | Giữ ALL |
| 5 | FE | API 5 drawer hay trang riêng? | Drawer + vẫn giữ trang riêng |
| 6 | FE | Link sang nhà bán/user dùng khoảng bộ lọc hay khoảng của kỳ? | Bộ lọc tổng quan, kẹp hôm nay |
| 7 | FE | Có truyền `backFrom/backTo/backPeriod` khi mở Chi tiết kỳ? | Có |
| 8 | Nhóm | Có ghim `MOCK_NOW` cho mock? | Có, `2026-10-27T14:45+07:00` |
| 9 | BE | Khi kỳ trước = 0, `growthPercent` null hay vắng field? | Null |
| 10 | Mentor | Xác nhận GMV theo `order_total` | Theo `order_total` |
