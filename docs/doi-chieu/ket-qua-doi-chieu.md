# Kết quả đồng bộ FE với hợp đồng BE

Cập nhật: 12/11/2026 · nguồn: `doi_chieu/doi-chieu-tat-ca-FE-API-contract-2026-11-12.xlsx`.

## Tổng hợp

| Trạng thái | Số dòng |
|---|---|
| Xong | 56 |
| Làm một phần | 2 |
| Chờ API 2/3/4/5 | 3 |
| Ghi chú (không áp dụng) | 1 |
| **Tổng** | **62** |

Theo phase: P1 11 · P2 14 · P3 11 · P4 18 · P5 4

## Việc còn lại khi BE xong API 2/3/4/5

1. Thay `listOrders()` của period/buyer/seller bằng API 2 (hiện là mock).
2. Tab User mua / Nhà bán ở M2: dựng bảng khi có API 3/4.
3. M6: đổi mock sang API 5, đối chiếu breakdown ưu đãi theo M3 mục 4.

## 62 dòng đối chiếu

| # | FE | API | Chỗ lệch | Mức | Phase | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | FE-A (Chinh) | API 1 | Envelope và lỗi | Cao | P1 | Xong |
| 2 | FE-A (Chinh) | API 1 | Tên tham số query | Cao | P1 | Xong |
| 3 | FE-A (Chinh) | API 1 | Dạng response | Cao | P2 | Xong |
| 4 | FE-A (Chinh) | API 1 | Cách lấy KPI | Cao | P2 | Xong |
| 5 | FE-A (Chinh) | API 1 | Phần trăm tăng trưởng | Trung bình | P2 | Xong |
| 6 | FE-A (Chinh) | API 1 | Khoá và nhãn kỳ | Trung bình | P2 | Xong |
| 7 | FE-A (Chinh) | API 1 | Kỳ so sánh (mock) | Trung bình | P2 | Xong |
| 8 | FE-A (Chinh) | API 1 | Khoảng thời gian | Trung bình | P1 | Xong |
| 9 | FE-A (Chinh) | API 1 | Top nhà bán | Cao | P2 | Xong |
| 10 | FE-A (Chinh) | API 1 | Top user mua | Cao | P2 | Xong |
| 11 | FE-A (Chinh) | API 1 | Biểu đồ | Cao | P2 | Xong |
| 12 | FE-A (Chinh) | API 1 | Bảng số liệu | Trung bình | P2 | Xong |
| 13 | FE-A (Chinh) | API 1 | Tooltip | Trung bình | P2 | Làm một phần |
| 14 | FE-A (Chinh) | API 1 | Tên field | Thấp | P2 | Xong |
| 15 | FE-A (Chinh) | API 1 | Số "Xem tất cả n nhà bán" | Thấp | P2 | Xong |
| 16 | FE-A (Chinh) | Chung | Bộ lọc dùng chung | Trung bình | P1 | Xong |
| 17 | FE-A (Chinh) | Chung | Delta.pct trong base.ts | Thấp | P1 | Xong |
| 18 | FE-A (Chinh) | Chung | GMV | Cao | P2 | Xong |
| 19 | FE-A (Chinh) | Chung | Đơn hợp lệ | Thấp | P2 | Xong |
| 20 | FE-A (Chinh) | Chung | Lỗi 404 NOT_FOUND | Trung bình | P1 | Xong |
| 21 | FE-A (Chinh) | Chung | Đơn vị phần trăm | Trung bình | P1 | Xong |
| 22 | FE-A (Chinh) | Chung | Số dạng chuỗi | Thấp | P1 | Xong |
| 23 | FE-A (Chinh) | Chung | Ràng buộc ngày theo từng API | Trung bình | P1 | Xong |
| 24 | FE-A (Chinh) | Chung | Ô ngày cho phép chọn tương lai | Thấp | P1 | Xong |
| 25 | FE-B (Long) | API 2 | Bảng đơn ở Chi tiết kỳ | Trung bình | — | Chờ API 2/3/4/5 |
| 26 | FE-B (Long) | API 3, API 4 | Tab User mua / Nhà bán ở Chi tiết kỳ | Thấp | — | Chờ API 2/3/4/5 |
| 27 | FE-B (Long) | API 5 | Chi tiết đơn hàng | Thấp | — | Chờ API 2/3/4/5 |
| 28 | FE-B (Long) | API 6 | Endpoint | Cao | P3 | Xong |
| 29 | FE-B (Long) | API 6 | Tham số | Cao | P3 | Xong |
| 30 | FE-B (Long) | API 6 | Phần đầu trang | Trung bình | P3 | Xong |
| 31 | FE-B (Long) | API 6 | KPI so với kỳ trước | Trung bình | P3 | Xong |
| 32 | FE-B (Long) | API 6 | Định nghĩa khách mới | Trung bình | P3 | Xong |
| 33 | FE-B (Long) | API 6 | Biểu đồ phân bổ | Cao | P3 | Xong |
| 34 | FE-B (Long) | API 6 | Dòng "Cao nhất" | Thấp | P3 | Xong |
| 35 | FE-B (Long) | API 6 | 3 tab Đơn hàng / User mua / Nhà bán | Trung bình | P3 | Làm một phần |
| 36 | FE-B (Long) | API 6 | Link sang Chi tiết nhà bán / user từ tab | Trung bình | P3 | Xong |
| 37 | FE-B (Long) | API 6 | Nhận link từ trang tổng quan | Cao | P3 | Xong |
| 38 | FE-B (Long) | API 6 | Lỗi gõ class | Thấp | P3 | Xong |
| 39 | FE-C (Phúc) | API 7 | Endpoint | Cao | P4 | Xong |
| 40 | FE-C (Phúc) | API 7 | Thông tin nhà bán | Thấp | P4 | Xong |
| 41 | FE-C (Phúc) | API 7 | Tỉ lệ hoàn thành | Trung bình | P4 | Xong |
| 42 | FE-C (Phúc) | API 7 | KPI đặt tên | Thấp | P4 | Xong |
| 43 | FE-C (Phúc) | API 7 | Biểu đồ | Cao | P4 | Xong |
| 44 | FE-C (Phúc) | API 7 | Nút Số đơn / GMV / User mua | Trung bình | P4 | Xong |
| 45 | FE-C (Phúc) | API 7 | Bấm mốc để lọc đơn | Trung bình | P4 | Xong |
| 46 | FE-C (Phúc) | API 7 | Nút "Về mặc định" | Thấp | P4 | Xong |
| 47 | FE-C (Phúc) | API 7 | Bỏ so sánh kỳ trước | Thấp | P4 | Xong |
| 48 | FE-C (Phúc) | API 7, API 8 | Nhận link từ trang khác | Trung bình | P4 | Xong |
| 49 | FE-C (Phúc) | API 8 | Số đơn ở API 8 | Thấp | — | Ghi chú |
| 50 | FE-C (Phúc) | API 8 | Endpoint và tên đường dẫn | Cao | P4 | Xong |
| 51 | FE-C (Phúc) | API 8 | Thông tin khách | Trung bình | P4 | Xong |
| 52 | FE-C (Phúc) | API 8 | Số đơn | Trung bình | P4 | Xong |
| 53 | FE-C (Phúc) | API 8 | Giá trị TB/đơn | Thấp | P4 | Xong |
| 54 | FE-C (Phúc) | API 8 | % tăng trưởng giá trị mua | Trung bình | P4 | Xong |
| 55 | FE-C (Phúc) | API 8 | Nhà bán mua nhiều nhất | Trung bình | P4 | Xong |
| 56 | FE-C (Phúc) | API 8 | Biểu đồ giá trị mua | Trung bình | P4 | Xong |
| 57 | FE-C (Phúc) | API 8 | Ngày đơn đầu / gần nhất | Thấp | P4 | Xong |
| 58 | FE-A + FE-B | API 6 | Link sang Chi tiết kỳ (API 6) | Cao | P5 | Xong |
| 59 | FE-A + FE-C | API 7 | Link sang Chi tiết nhà bán (API 7) | Trung bình | P5 | Xong |
| 60 | FE-A + FE-C | API 8 | Link sang Chi tiết user (API 8) | Trung bình | P5 | Xong |
| 61 | Cả nhóm | Chung | Tên tham số trên URL | Thấp | P1 | Xong |
| 62 | Cả nhóm | Chung | Danh sách đơn nằm trong getDetail | Cao | P5 | Xong |