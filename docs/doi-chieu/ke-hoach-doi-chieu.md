# Kế hoạch đồng bộ FE với hợp đồng BE (P0)

Nguồn: `doi_chieu/doi-chieu-tat-ca-FE-API-contract-2026-11-12.xlsx` (sheet **Xung đột**, 62 dòng).
Bảng dưới đây map từng dòng sang phase thi công, trạng thái và file đích.

## Tổng hợp

| Phase | Nội dung | Số dòng |
|---|---|---|
| P1 | Nền chung (gatewayFetch, parse số, validator, quy ước %) | 11 |
| P2 | API 1 — hub /growth | 14 |
| P3 | API 6 — period-summary | 11 |
| P4 | API 7 + API 8 — seller / buyer | 18 |
| P5 | Liên kết trang, export, dọn dẹp | 4 |
| — | Chờ API 2/3/4/5 (đóng băng) | 3 |
| — | Không áp dụng | 1 |

Ghi chú phạm vi:

- API 2 (danh sách đơn), API 3 (user mua), API 4 (nhà bán), API 5 (chi tiết đơn) **chưa có hợp đồng**.
  Các dòng liên quan bị đóng băng: không sửa shape, không dựng bảng giả, giữ mock + TODO.
- Màn M6 `/orders/[orderId]` không bị chạm trong đợt này.
- Ngoại lệ được làm: tách `getSummary()` / `listOrders()` để cô lập mock của API 2.

## Chi tiết 62 dòng

| # | FE | API | Chỗ lệch | Mức | Phase | Trạng thái | File đích |
|---|---|---|---|---|---|---|---|
| 1 | FE-A (Chinh) | API 1 | Envelope và lỗi | Cao | P1 | Xong | `src/platform/reports/http.ts` |
| 2 | FE-A (Chinh) | API 1 | Tên tham số query | Cao | P1 | Xong | `src/platform/reports/filters.ts; growth.http.ts` |
| 3 | FE-A (Chinh) | API 1 | Dạng response | Cao | P2 | Xong | `server/growth.schema.ts; server/growth.mapper.ts` |
| 4 | FE-A (Chinh) | API 1 | Cách lấy KPI | Cao | P2 | Xong | `growth.mapper.ts; components/growth-kpis.tsx` |
| 5 | FE-A (Chinh) | API 1 | Phần trăm tăng trưởng | Trung bình | P2 | Xong | `growth.mapper.ts` |
| 6 | FE-A (Chinh) | API 1 | Khoá và nhãn kỳ | Trung bình | P2 | Xong | `growth.mapper.ts; components/*` |
| 7 | FE-A (Chinh) | API 1 | Kỳ so sánh (mock) | Trung bình | P2 | Xong | `server/growth.report-builder.ts` |
| 8 | FE-A (Chinh) | API 1 | Khoảng thời gian | Trung bình | P1 | Xong | `src/features/growth-overview/periods.ts` |
| 9 | FE-A (Chinh) | API 1 | Top nhà bán | Cao | P2 | Xong | `contracts.ts; components/top-sellers-table.tsx; page.tsx` |
| 10 | FE-A (Chinh) | API 1 | Top user mua | Cao | P2 | Xong | `growth.schema.ts; contracts.ts; panel kỳ` |
| 11 | FE-A (Chinh) | API 1 | Biểu đồ | Cao | P2 | Xong | `components/growth-bars.tsx → growth-line.tsx` |
| 12 | FE-A (Chinh) | API 1 | Bảng số liệu | Trung bình | P2 | Xong | `app/(admin)/growth/page.tsx` |
| 13 | FE-A (Chinh) | API 1 | Tooltip | Trung bình | P2 | Làm một phần | `components/growth-line.tsx` |
| 14 | FE-A (Chinh) | API 1 | Tên field | Thấp | P2 | Xong | `contracts.ts; app/api/exports/growth/route.ts` |
| 15 | FE-A (Chinh) | API 1 | Số "Xem tất cả n nhà bán" | Thấp | P2 | Xong | `page.tsx; top-sellers-table.tsx` |
| 16 | FE-A (Chinh) | Chung | Bộ lọc dùng chung | Trung bình | P1 | Xong | `src/platform/reports/filters.ts` |
| 17 | FE-A (Chinh) | Chung | Delta.pct trong base.ts | Thấp | P1 | Xong | `src/contracts/base.ts; README` |
| 18 | FE-A (Chinh) | Chung | GMV | Cao | P2 | Xong | `growth.report-builder.ts; growth.mock.ts; test` |
| 19 | FE-A (Chinh) | Chung | Đơn hợp lệ | Thấp | P2 | Xong | `src/platform/mock/aggregate.ts` |
| 20 | FE-A (Chinh) | Chung | Lỗi 404 NOT_FOUND | Trung bình | P1 | Xong | `src/platform/reports/http.ts` |
| 21 | FE-A (Chinh) | Chung | Đơn vị phần trăm | Trung bình | P1 | Xong | `README; mapper từng slice` |
| 22 | FE-A (Chinh) | Chung | Số dạng chuỗi | Thấp | P1 | Xong | `src/platform/reports/ (file mới parse.ts)` |
| 23 | FE-A (Chinh) | Chung | Ràng buộc ngày theo từng API | Trung bình | P1 | Xong | `src/platform/reports/filters.ts` |
| 24 | FE-A (Chinh) | Chung | Ô ngày cho phép chọn tương lai | Thấp | P1 | Xong | `src/platform/ui/report-filter.tsx` |
| 25 | FE-B (Long) | API 2 | Bảng đơn ở Chi tiết kỳ | Trung bình | — | Chờ hợp đồng | `period-detail; platform/ui/order-table.tsx` |
| 26 | FE-B (Long) | API 3, API 4 | Tab User mua / Nhà bán ở Chi tiết kỳ | Thấp | — | Chờ hợp đồng | `period-detail` |
| 27 | FE-B (Long) | API 5 | Chi tiết đơn hàng | Thấp | — | Chờ hợp đồng | `src/features/order-detail/` |
| 28 | FE-B (Long) | API 6 | Endpoint | Cao | P3 | Xong | `src/features/period-detail/server/period.http.ts (mới), source.ts` |
| 29 | FE-B (Long) | API 6 | Tham số | Cao | P3 | Xong | `period.http.ts; app/(admin)/growth/period/page.tsx` |
| 30 | FE-B (Long) | API 6 | Phần đầu trang | Trung bình | P3 | Xong | `app/(admin)/growth/period/page.tsx` |
| 31 | FE-B (Long) | API 6 | KPI so với kỳ trước | Trung bình | P3 | Xong | `period.mock.ts; mapper; page` |
| 32 | FE-B (Long) | API 6 | Định nghĩa khách mới | Trung bình | P3 | Xong | `src/platform/mock/aggregate.ts (newBuyerRate); period.mock.ts` |
| 33 | FE-B (Long) | API 6 | Biểu đồ phân bổ | Cao | P3 | Xong | `contracts.ts; components/daily-bars.tsx` |
| 34 | FE-B (Long) | API 6 | Dòng "Cao nhất" | Thấp | P3 | Xong | `components/daily-bars.tsx` |
| 35 | FE-B (Long) | API 6 | 3 tab Đơn hàng / User mua / Nhà bán | Trung bình | P3 | Làm một phần | `app/(admin)/growth/period/page.tsx` |
| 36 | FE-B (Long) | API 6 | Link sang Chi tiết nhà bán / user từ tab | Trung bình | P3 | Xong | `page tab Nhà bán / User` |
| 37 | FE-B (Long) | API 6 | Nhận link từ trang tổng quan | Cao | P3 | Xong | `page.tsx` |
| 38 | FE-B (Long) | API 6 | Lỗi gõ class | Thấp | P3 | Xong | `app/(admin)/growth/period/page.tsx` |
| 39 | FE-C (Phúc) | API 7 | Endpoint | Cao | P4 | Xong | `src/features/seller-detail/server/seller.http.ts (mới), source.ts` |
| 40 | FE-C (Phúc) | API 7 | Thông tin nhà bán | Thấp | P4 | Xong | `contracts.ts; page` |
| 41 | FE-C (Phúc) | API 7 | Tỉ lệ hoàn thành | Trung bình | P4 | Xong | `seller.mock.ts` |
| 42 | FE-C (Phúc) | API 7 | KPI đặt tên | Thấp | P4 | Xong | `contracts.ts` |
| 43 | FE-C (Phúc) | API 7 | Biểu đồ | Cao | P4 | Xong | `contracts.ts; seller.mock.ts; page` |
| 44 | FE-C (Phúc) | API 7 | Nút Số đơn / GMV / User mua | Trung bình | P4 | Xong | `page / component chart mới` |
| 45 | FE-C (Phúc) | API 7 | Bấm mốc để lọc đơn | Trung bình | P4 | Xong | `page` |
| 46 | FE-C (Phúc) | API 7 | Nút "Về mặc định" | Thấp | P4 | Xong | `page; platform/ui/report-filter.tsx` |
| 47 | FE-C (Phúc) | API 7 | Bỏ so sánh kỳ trước | Thấp | P4 | Xong | `contracts.ts` |
| 48 | FE-C (Phúc) | API 7, API 8 | Nhận link từ trang khác | Trung bình | P4 | Xong | `page seller / customer` |
| 49 | FE-C (Phúc) | API 8 | Số đơn ở API 8 | Thấp | — | Ghi chú | `—` |
| 50 | FE-C (Phúc) | API 8 | Endpoint và tên đường dẫn | Cao | P4 | Xong | `src/features/buyer-detail/server/buyer.http.ts (mới), source.ts` |
| 51 | FE-C (Phúc) | API 8 | Thông tin khách | Trung bình | P4 | Xong | `contracts.ts; page` |
| 52 | FE-C (Phúc) | API 8 | Số đơn | Trung bình | P4 | Xong | `contracts.ts; buyer.mock.ts; page` |
| 53 | FE-C (Phúc) | API 8 | Giá trị TB/đơn | Thấp | P4 | Xong | `mapper` |
| 54 | FE-C (Phúc) | API 8 | % tăng trưởng giá trị mua | Trung bình | P4 | Xong | `contracts.ts; buyer.mock.ts; page` |
| 55 | FE-C (Phúc) | API 8 | Nhà bán mua nhiều nhất | Trung bình | P4 | Xong | `buyer.mock.ts; page` |
| 56 | FE-C (Phúc) | API 8 | Biểu đồ giá trị mua | Trung bình | P4 | Xong | `contracts.ts; page` |
| 57 | FE-C (Phúc) | API 8 | Ngày đơn đầu / gần nhất | Thấp | P4 | Xong | `buyer.mock.ts` |
| 58 | FE-A + FE-B | API 6 | Link sang Chi tiết kỳ (API 6) | Cao | P5 | Xong | `growth-line.tsx (FE-1); app/(admin)/growth/period (FE-B)` |
| 59 | FE-A + FE-C | API 7 | Link sang Chi tiết nhà bán (API 7) | Trung bình | P5 | Xong | `top-sellers-table.tsx; panel kỳ` |
| 60 | FE-A + FE-C | API 8 | Link sang Chi tiết user (API 8) | Trung bình | P5 | Xong | `panel kỳ` |
| 61 | Cả nhóm | Chung | Tên tham số trên URL | Thấp | P1 | Xong | `src/platform/reports/filters.ts` |
| 62 | Cả nhóm | Chung | Danh sách đơn nằm trong getDetail | Cao | P5 | Xong | `contracts.ts của period/seller/buyer` |

## Việc cần chốt trước khi sang P1 (đã chốt — P1 xong 12/11/2026)

1. URL giữ `?from&to&period`, chỉ đổi tên tham số ở `toApiQuery()` — đồng ý?
2. Trang nhà bán / user luôn nhận `?from&to` từ trang nguồn, `toDate = min(to, hôm nay)` — đồng ý?
3. View model dùng % dạng 0..1, mapper chia 100 một lần — đồng ý?
4. Tách `getSummary` + `listOrders` ngay, listOrders vẫn mock — đồng ý?

Sau khi 4 điểm này được duyệt mới bắt đầu P1.