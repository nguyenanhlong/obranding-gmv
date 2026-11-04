# Prompt phân tích lại thiết kế (dùng cho Tech Lead / agent)

Dùng prompt này khi cần bóc lại artifact **OBranding Admin – Tăng trưởng** hoặc khi design thay đổi.
Lưu ý quan trọng: link `claude.ai/artifact/...` **không đọc được bằng fetch thường** (trang render bằng JS).
Phải mở bằng trình duyệt thật (in-app browser), rồi đọc `innerText` của từng frame `about:srcdoc` — mỗi frame là 1 artboard.

---

```text
# VAI TRÒ
Bạn là Tech Lead Frontend. Nhiệm vụ: bóc tách CHÍNH XÁC một artifact thiết kế gồm nhiều artboard, đối chiếu với code hiện có, rồi phân lại việc cho 3 FE theo màn hình.

# NGUỒN
- Artifact: https://claude.ai/artifact/2snY6tWvaqYnuCV2bjSmp4
- Cách đọc: mở bằng in-app browser → liệt kê frames → mỗi frame `about:srcdoc` là 1 artboard → lấy `document.body.innerText` (+ đếm svg/table/input để biết loại component).
- Fetch thường sẽ chỉ trả shell HTML rỗng. Nếu chỉ có shell, DỪNG và yêu cầu người dùng gửi ảnh từng artboard.

# NHIỆM VỤ 0 — Kiểm kê artboard
Với MỖI artboard, ghi: mã frame, tiêu đề, độ dài text, và 1 dòng mô tả. Không gộp nhiều artboard thành một. Nếu có artboard là tài liệu đặc tả (không phải UI), đánh dấu riêng — nó là nguồn chân lý cho hợp đồng dữ liệu, không phải màn hình.

# NHIỆM VỤ 1 — Bóc block từng màn hình
Với mỗi màn hình UI, liệt kê theo đúng thứ tự trên màn hình:
- Khung: sidebar / breadcrumb / header / action bar / nội dung.
- Bộ lọc: mọi control, giá trị mặc định, kiểu điều khiển.
- Tab / segmented control: tên từng tab và thứ tự.
- KPI tile: nhãn, giá trị mẫu, đơn vị, phần phụ (% so kỳ trước, ghi chú dưới số).
- Chart: loại, số series, trục, nhãn trên cột, tooltip, hành vi click (drill-down đi đâu).
- Bảng: đúng thứ tự cột, kiểu dữ liệu từng cột, cột nào sort được, có search/filter/paging không, mỗi trang bao nhiêu dòng, hành động trên dòng.
- Panel phụ (ví dụ "Số liệu theo tháng", "Top nhà bán của user").
- State: loading / empty / error / kỳ đang diễn ra (tạm tính) / phân trang.
Mỗi dòng ghi kèm dữ liệu mẫu xuất hiện trong design để làm fixture về sau.

# NHIỆM VỤ 2 — Bóc đặc tả số liệu
Từ artboard đặc tả, chép lại: quy ước đếm (đơn cha/con, trường thời gian, timezone), định nghĩa từng chỉ số kèm công thức, quy tắc làm tròn/đơn vị, công thức tăng trưởng, cách xử lý kỳ đang diễn ra, danh sách endpoint đề xuất, và mục "điểm cần chốt".
Đánh dấu rõ chỗ nào design nói "Đề xuất" (chưa có trong backend).

# NHIỆM VỤ 3 — Đối chiếu với code hiện có
Lập bảng 4 cột: Hạng mục trong design | Trạng thái trong code (có / thiếu / sai / thừa) | File hiện tại | Hành động (giữ / sửa / xoá / thêm).
Đặc biệt chỉ ra những thứ code đang có mà design KHÔNG có — phải xoá, không được giữ vì "lỡ làm rồi".

# NHIỆM VỤ 4 — Phân lại việc
Ràng buộc:
- Chia theo MÀN HÌNH (vertical slice), không chia theo tầng (không có "người làm API", "người làm chart").
- Mỗi file/folder đúng một owner. Không có file dùng chung do 2 người sửa.
- Màn hình hub thuộc về người sở hữu platform (filter, shell, export).
- Màn drill-down chia theo miền dữ liệu, không chia theo vị trí trên màn hình.
- Nếu một component bị dùng ở ≥2 màn (ví dụ bảng đơn hàng), nó phải nằm trong vùng shared do 1 người sở hữu, và kiểu dữ liệu của nó nằm trong contracts.
Xuất bảng: Màn hình | Owner | Route | Feature folder | Ước lượng S/M/L | Phụ thuộc.

# NHIỆM VỤ 5 — Hợp đồng dữ liệu
- Route tree đầy đủ (App Router), chỉ rõ folder nào của ai.
- Type dùng chung đặt ở contracts, đánh dấu ai sở hữu.
- Với mỗi màn: interface `<X>Source` + danh sách method, khớp 1-1 với endpoint trong đặc tả.
- Quy ước filter/query params dùng chung, có validate.
- Bảng endpoint: method | path | query | response type | owner | fixture.

# NHIỆM VỤ 6 — Kế hoạch sửa
- Thứ tự thao tác trên git: cái gì xoá trước, cái gì thêm sau, để repo không có giai đoạn build đỏ kéo dài.
- Với mỗi owner: danh sách file cần xoá, cần tạo, cần sửa.
- Cập nhật CODEOWNERS + TASKS + README trong cùng một PR.
- Nêu rõ phần nào của code cũ còn tái dùng được (platform, CI, contract pattern) để không đập hết.

# OUTPUT
1. Bảng kiểm kê artboard.
2. Bóc block từng màn (đủ chi tiết để người khác dựng lại không cần mở design).
3. Bảng đặc tả số liệu + endpoint.
4. Bảng đối chiếu code cũ (giữ/sửa/xoá/thêm).
5. Bảng phân công mới + route tree.
6. Danh sách việc theo từng owner, có thứ tự.
7. Danh sách câu hỏi cần chốt (chỉ những câu design chưa trả lời).
Không viết code UI ở bước này. Không suy diễn block không có trong design.
```

---

## Vì sao prompt này khác bản trước

| Bản trước | Bản này |
|---|---|
| Cho rằng chỉ có 1 màn hình | Bắt kiểm kê artboard trước, không gộp |
| Không đọc được design nên phải giả định | Ghi rõ cách đọc artifact nhiều frame |
| Chia theo "doanh thu / đơn / user" (đoán) | Chia theo màn hình, sau khi đã có danh sách màn |
| Không có bước đối chiếu code cũ | Bắt buộc bảng giữ/sửa/xoá/thêm |
| Bỏ qua artboard đặc tả | Coi artboard đặc tả là hợp đồng dữ liệu |
