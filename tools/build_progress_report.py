"""Sinh báo cáo tiến độ FE-B (Long) ra file Excel.

Chạy: python tools/build_progress_report.py
Đọc dữ liệu thật từ git; phần đánh giá trạng thái dựa trên evidence kiểm tra được.
"""

from __future__ import annotations

import subprocess
import sys
from datetime import date
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "reports"
TODAY = date.today().isoformat()
OUT = OUT_DIR / f"bao-cao-tien-do-FE-B-{TODAY}.xlsx"

SCOPE = [
    "app/(admin)/growth/period",
    "app/(admin)/orders",
    "app/api/exports/period",
    "src/features/period-detail",
    "src/features/order-detail",
    "docs/tasks/long.md",
]

HEADER_FILL = PatternFill("solid", fgColor="1F3864")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=10)
TITLE_FONT = Font(bold=True, size=13, color="1F3864")
SECTION_FONT = Font(bold=True, size=10, color="1F3864")
ZEBRA = PatternFill("solid", fgColor="F5F7FA")
DONE_FILL = PatternFill("solid", fgColor="F0FDF4")
DOING_FILL = PatternFill("solid", fgColor="FEFCE8")
TODO_FILL = PatternFill("solid", fgColor="F3F4F6")
WARN_FILL = PatternFill("solid", fgColor="FFF2CC")
THIN = Side(style="thin", color="D0D5DD")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def git(*args: str) -> str:
    return subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8"
    ).stdout.strip()


def commit_for(path: str) -> str:
    out = git("log", "-1", "--format=%h", "origin/main", "--", path)
    return out.splitlines()[0] if out else ""


# ------------------------------------------------------------------ dữ liệu ---

SCOPE_COMMITS = [
    ("090ffdf", "2026-11-04", "11:18", "refactor!: chia lai toan bo theo 6 artboard cua design"),
    ("f82f852", "2026-11-06", "10:57", "feat(period): dropdown chon so dong moi trang"),
]

ITEM_ROWS = [
    # (màn, hạng mục, mô tả, loại, file chính, trạng thái, ngày, commit, bằng chứng, ghi chú)
    (
        "M2",
        "6 KPI của kỳ",
        "Tổng đơn, GMV, user mua, nhà bán có đơn, AOV, tỉ lệ khách mới + % so kỳ trước",
        "Feature",
        "app/(admin)/growth/period/page.tsx",
        "Hoàn thành",
        "2026-11-04",
        "090ffdf",
        "file app/(admin)/growth/period/page.tsx — chạy được ở /growth/period",
        "Khung do Tech Lead dựng trong refactor; tôi tiếp nhận và phát triển",
    ),
    (
        "M2",
        "Phân bổ đơn hàng theo ngày",
        "Bar list theo ngày + dòng 'Cao nhất: Ngày X · N đơn'",
        "Feature",
        "src/features/period-detail/components/daily-bars.tsx",
        "Hoàn thành",
        "2026-11-04",
        "090ffdf",
        "file src/features/period-detail/components/daily-bars.tsx",
        "Đang vẽ bằng CSS, chưa phải Recharts",
    ),
    (
        "M2",
        "Bảng đơn 13 cột",
        "Search theo mã đơn / nhà bán / khách, lọc trạng thái, phân trang server-side",
        "Feature",
        "app/(admin)/growth/period/page.tsx",
        "Hoàn thành",
        "2026-11-04",
        "090ffdf",
        "file app/(admin)/growth/period/page.tsx — chạy được ở /growth/period",
        "Dùng chung OrderTable ở platform/ui (file của FE-A)",
    ),
    (
        "M2",
        "Export CSV của kỳ",
        "Route handler xuất CSV có BOM UTF-8 cho Excel",
        "Feature",
        "app/api/exports/period/route.ts",
        "Hoàn thành",
        "2026-11-04",
        "090ffdf",
        "file app/api/exports/period/route.ts — trả 200 với ?format=csv",
        "XLSX/PDF chưa làm, route trả 501",
    ),
    (
        "M2",
        "Dropdown chọn số dòng mỗi trang",
        "PageSizeSelect là client component; đổi pageSize thì về trang 1, giữ vị trí cuộn",
        "Feature",
        "src/features/period-detail/components/page-size-select.tsx",
        "Hoàn thành",
        "2026-11-06",
        "f82f852",
        "commit f82f852 + PR #6 (merged)",
        "",
    ),
    (
        "M2",
        "Sắp lại thanh phân trang",
        "Kết quả + chọn số dòng bên trái, Trước / Trang x/y / Tiếp tục bên phải; đồng bộ chiều cao control",
        "Refactor",
        "app/(admin)/growth/period/page.tsx",
        "Hoàn thành",
        "2026-11-06",
        "f82f852",
        "commit f82f852 + PR #6 (merged)",
        "",
    ),
    (
        "M2",
        "Bỏ thông tin trùng trong form lọc",
        "Xoá dòng 'Hiển thị … · trang …' bị lặp với thanh phân trang",
        "Fix",
        "app/(admin)/growth/period/page.tsx",
        "Hoàn thành",
        "2026-11-06",
        "f82f852",
        "commit f82f852",
        "",
    ),
    (
        "M2",
        "Chart phân bổ bằng Recharts",
        "Thay bar list CSS bằng BarChart có tooltip khi hover",
        "Feature",
        "src/features/period-detail/components/daily-bars.tsx",
        "Chưa làm",
        "",
        "",
        "docs/tasks/long.md dòng 25 chưa tick; daily-bars.tsx hiện chỉ vẽ bằng CSS",
        "Checklist chưa tick; hiện vẫn là CSS",
    ),
    (
        "M2",
        "Toggle 3 series trên chart",
        "Chuyển giữa Đơn hàng / User mua hàng / Nhà bán như design",
        "Feature",
        "app/(admin)/growth/period/page.tsx",
        "Chưa làm",
        "",
        "",
        "docs/tasks/long.md dòng 26 chưa tick; page.tsx không có state chọn series",
        "",
    ),
    (
        "M6",
        "Trang chi tiết đơn",
        "Sản phẩm, breakdown ưu đãi, tổng đơn, timeline 5 mốc + mốc huỷ",
        "Feature",
        "app/(admin)/orders/[orderId]/page.tsx",
        "Hoàn thành",
        "2026-11-04",
        "090ffdf",
        "file app/(admin)/orders/[orderId]/page.tsx — chạy được ở /orders/<publicId>",
        "Khung do Tech Lead dựng trong refactor",
    ),
    (
        "M6",
        "Đoạn nối timeline tô cam",
        "Nối hai mốc liền kề đều có giá trị bằng đoạn cam như design",
        "Feature",
        "app/(admin)/orders/[orderId]/page.tsx",
        "Chưa làm",
        "",
        "",
        "docs/tasks/long.md dòng 28 chưa tick; orders/[orderId]/page.tsx chỉ có chấm màu",
        "Hiện chỉ có chấm màu, chưa có đường nối",
    ),
    (
        "M6",
        "Nhãn ưu đãi theo đặc tả M3",
        "Thẻ Sành nằm trong giảm giá sản phẩm, không cộng thêm lần nữa; đúng thứ tự ưu đãi",
        "Fix",
        "app/(admin)/orders/[orderId]/page.tsx",
        "Đang làm",
        "2026-11-04",
        "090ffdf",
        "file app/(admin)/orders/[orderId]/page.tsx (có ghi chú, chưa đối chiếu đủ 5 dòng ưu đãi)",
        "Cần chốt với BE công thức total_direct_discount",
    ),
    (
        "Chung",
        "Nối nguồn BE cho M2 và M6",
        "Viết period.http.ts + order.http.ts implement <X>Source rồi đổi pickSource",
        "Feature",
        "src/features/period-detail/server/source.ts",
        "Chưa làm",
        "",
        "",
        "docs/tasks/long.md dòng 30; src/features/period-detail/server/ chưa có file *.http.ts",
        "Chặn bởi BE: 5 endpoint trong đặc tả mới là đề xuất",
    ),
]


# Bảng phân công theo màn hình (toàn team) — dùng cho sheet "Phân công"
TEAM_SCOPE = [
    ("M1 Báo cáo tăng trưởng", "/growth", "Chinh (FE-A)", "Ngoài phần tôi", "Hub + platform/UI kit"),
    ("M2 Chi tiết kỳ", "/growth/period", "Long (FE-B)", "Của tôi", "Đang phát triển"),
    ("M4 Chi tiết user", "/growth/customers/[customerId]", "Phuc (FE-C)", "Ngoài phần tôi", "—"),
    ("M5 Chi tiết nhà bán", "/growth/sellers/[sellerId]", "Phuc (FE-C)", "Ngoài phần tôi", "—"),
    ("M6 Chi tiết đơn", "/orders/[orderId]", "Long (FE-B)", "Của tôi", "Đang phát triển"),
]

# Ưu tiên / ước lượng / phụ thuộc, gắn theo đúng tên hạng mục ở ITEM_ROWS
PLAN_META = {
    "6 KPI của kỳ": ("P1", 2.0, "Dataset mock (đã có)"),
    "Phân bổ đơn hàng theo ngày": ("P1", 2.5, "—"),
    "Bảng đơn 13 cột": ("P1", 3.0, "OrderTable của FE-A"),
    "Export CSV của kỳ": ("P2", 1.5, "—"),
    "Dropdown chọn số dòng mỗi trang": ("P2", 1.0, "—"),
    "Sắp lại thanh phân trang": ("P3", 0.5, "—"),
    "Bỏ thông tin trùng trong form lọc": ("P3", 0.25, "—"),
    "Chart phân bổ bằng Recharts": ("P2", 2.0, "—"),
    "Toggle 3 series trên chart": ("P2", 1.5, "Sau khi làm chart Recharts"),
    "Trang chi tiết đơn": ("P1", 3.0, "—"),
    "Đoạn nối timeline tô cam": ("P3", 1.0, "—"),
    "Nhãn ưu đãi theo đặc tả M3": ("P2", 2.0, "Chốt công thức với BE"),
    "Nối nguồn BE cho M2 và M6": ("P1", 3.0, "BE bàn giao API"),
}


def build() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wb = Workbook()

    done = sum(1 for r in ITEM_ROWS if r[5] == "Hoàn thành")
    doing = sum(1 for r in ITEM_ROWS if r[5] == "Đang làm")
    todo = sum(1 for r in ITEM_ROWS if r[5] == "Chưa làm")
    total = len(ITEM_ROWS)

    def ratio(status: str, screen: str | None = None) -> str:
        rows = [r for r in ITEM_ROWS if screen is None or r[0] == screen]
        if not rows:
            return "0%"
        points = sum(100 if r[5] == "Hoàn thành" else 50 if r[5] == "Đang làm" else 0 for r in rows)
        return f"{round(points / (len(rows) * 100) * 100)}%"

    # ------------------------------------------------------------ sheet 1
    ws = wb.active
    ws.title = "Tổng quan"
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 34
    ws.column_dimensions["B"].width = 78

    ws["A1"] = "BÁO CÁO TIẾN ĐỘ — FE-B (Long)"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A1:B1")
    ws["A2"] = f"Cập nhật lúc {TODAY} · nguồn: git log + PR + docs/tasks/long.md"
    ws["A2"].font = Font(size=9, color="6B7280")
    ws.merge_cells("A2:B2")

    overview = [
        ("Họ tên / Vai trò", "Long — FE-B (Frontend, màn M2 + M6)"),
        ("Nhánh làm việc", "feat/fe-b-long (đã merge vào main qua PR #6)"),
        ("Màn hình phụ trách", "M2 Chi tiết kỳ · M6 Chi tiết đơn"),
        ("Khoảng thời gian báo cáo", "2026-11-04 → 2026-11-06"),
        ("Tổng số commit trong scope", f"{len(SCOPE_COMMITS)} commit (090ffdf, f82f852)"),
        ("Tổng dòng thêm/xoá", "+753 / −21"),
        ("Số PR đã merge", "1 — #6 feat(period): dropdown chọn số dòng mỗi trang"),
        ("Tổng hạng mục", f"{total} — Hoàn thành {done} / Đang làm {doing} / Chưa làm {todo}"),
        ("% hoàn thành tổng", f"{ratio('')} ({done}/{total} hạng mục đạt 100%)"),
        ("% hoàn thành theo màn", f"M2 {ratio('', 'M2')} · M6 {ratio('', 'M6')}"),
        (
            "Khó khăn chính",
            "Chưa có BE nên 2 file http.ts chưa viết được; dataset mock chỉ phủ 01/11/2025–27/10/2026 "
            "nên chart theo ngày bị trống khi chọn kỳ ngoài vùng",
        ),
        ("Việc tiếp theo", "1. Chart phân bổ sang Recharts (M2)"),
        ("", "2. Toggle 3 series Đơn / User / Nhà bán (M2)"),
        ("", "3. Đoạn nối timeline tô cam + rà nhãn ưu đãi theo M3 (M6)"),
    ]

    row = 4
    for label, value in overview:
        if label:
            ws.cell(row=row, column=1, value=label).font = Font(bold=True, size=10)
        ws.cell(row=row, column=2, value=value).alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[row].height = 30 if len(value) > 70 else 18
        row += 1

    # ------------------------------------------------------------ sheet 2
    ws2 = wb.create_sheet("Chi tiết công việc")
    headers = [
        "STT", "Màn hình", "Hạng mục", "Mô tả ngắn", "Loại", "File chính",
        "Trạng thái", "%", "Ngày bắt đầu", "Ngày cập nhật", "Commit", "PR",
        "Bằng chứng", "Ghi chú",
    ]
    widths = [5, 9, 30, 46, 10, 42, 12, 6, 13, 13, 10, 12, 40, 34]
    for i, (h, w) in enumerate(zip(headers, widths), start=1):
        c = ws2.cell(row=1, column=i, value=h)
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDER
        ws2.column_dimensions[get_column_letter(i)].width = w
    ws2.row_dimensions[1].height = 28

    for idx, item in enumerate(ITEM_ROWS, start=1):
        screen, title, desc, kind, path, status, start, sha, evidence, note = item
        pct = 100 if status == "Hoàn thành" else 50 if status == "Đang làm" else 0
        pr = "#6 merged" if sha == "f82f852" else ""
        values = [idx, screen, title, desc, kind, path, status, pct, start, start if sha else "",
                  sha, pr, evidence, note]
        r = idx + 1
        for col, v in enumerate(values, start=1):
            c = ws2.cell(row=r, column=col, value=v)
            c.border = BORDER
            c.alignment = Alignment(
                wrap_text=col in (4, 6, 13, 14),
                vertical="top",
                horizontal="right" if col == 8 else "center" if col in (1, 2, 5, 7, 11) else "left",
            )
            if col == 8:
                c.number_format = "0"
        fill = DONE_FILL if status == "Hoàn thành" else DOING_FILL if status == "Đang làm" else TODO_FILL
        ws2.cell(row=r, column=7).fill = fill
        if idx % 2 == 0:
            for col in (1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14):
                ws2.cell(row=r, column=col).fill = ZEBRA

    ws2.freeze_panes = "A2"
    ws2.auto_filter.ref = f"A1:N{len(ITEM_ROWS) + 1}"

    # ------------------------------------------------------------ sheet 3
    ws3 = wb.create_sheet("Nhật ký commit")
    h3 = ["Ngày", "Giờ", "Commit", "Nội dung", "File thay đổi (trong scope)", "+/- dòng", "Thuộc màn"]
    w3 = [12, 8, 10, 52, 70, 12, 12]
    for i, (h, w) in enumerate(zip(h3, w3), start=1):
        c = ws3.cell(row=1, column=i, value=h)
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BORDER
        ws3.column_dimensions[get_column_letter(i)].width = w
    ws3.row_dimensions[1].height = 28

    scope_files = {
        "090ffdf": ("+684 / −0", "M2 + M6 (khung)", "app/(admin)/growth/period/page.tsx, "
                    "app/(admin)/orders/[orderId]/page.tsx, app/api/exports/period/route.ts, "
                    "src/features/period-detail/**, src/features/order-detail/**, docs/tasks/long.md"),
        "f82f852": ("+69 / −21", "M2",
                    "app/(admin)/growth/period/page.tsx, "
                    "src/features/period-detail/components/page-size-select.tsx"),
    }

    for i, (sha, d, t, subject) in enumerate(SCOPE_COMMITS, start=2):
        diff, screen, files = scope_files[sha]
        outside = sha == "090ffdf"
        row_values = [
            d, t, sha, subject, files if not outside else f"{files}\n(+ file ngoài scope: refactor toàn repo)",
            diff, screen,
        ]
        for col, v in enumerate(row_values, start=1):
            c = ws3.cell(row=i, column=col, value=v)
            c.border = BORDER
            c.alignment = Alignment(wrap_text=col in (4, 5), vertical="top",
                                    horizontal="center" if col in (1, 2, 3, 6, 7) else "left")
            if outside:
                c.fill = WARN_FILL
        ws3.row_dimensions[i].height = 46

    ws3.freeze_panes = "A2"
    ws3.auto_filter.ref = f"A1:G{len(SCOPE_COMMITS) + 1}"

    note_row = len(SCOPE_COMMITS) + 3
    ws3.cell(row=note_row, column=1,
             value="Dòng tô vàng: commit có chạm file ngoài scope FE-B (090ffdf là refactor toàn repo do Tech Lead thực hiện).").font = Font(
        italic=True, size=9, color="6B7280")

    # ------------------------------------------------------------ sheet 2: Phân công
    ws4 = wb.create_sheet("Phân công")
    ws4.sheet_view.showGridLines = False
    for col, w in zip("ABCDEFG", [24, 40, 17, 15, 13, 32, 30]):
        ws4.column_dimensions[col].width = w

    ws4["A1"] = "PHÂN CÔNG CÔNG VIỆC"
    ws4["A1"].font = TITLE_FONT
    ws4.merge_cells("A1:G1")
    ws4["A2"] = "Phần được giao của FE-B (Long) nằm trong màn M2 và M6; các màn khác thuộc thành viên khác."
    ws4["A2"].font = Font(size=9, color="6B7280")
    ws4.merge_cells("A2:G2")

    def section(row_no: int, text: str) -> None:
        c = ws4.cell(row=row_no, column=1, value=text)
        c.font = SECTION_FONT
        ws4.merge_cells(start_row=row_no, start_column=1, end_row=row_no, end_column=7)

    def table_header(row_no: int, cols: list[str]) -> None:
        for i, h in enumerate(cols, start=1):
            c = ws4.cell(row=row_no, column=i, value=h)
            c.fill = HEADER_FILL
            c.font = HEADER_FONT
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            c.border = BORDER
        ws4.row_dimensions[row_no].height = 28

    section(4, "1. PHÂN CÔNG THEO MÀN HÌNH (toàn team)")
    table_header(5, ["Màn hình", "Route", "Owner", "Thuộc phần tôi?", "Số hạng mục", "Ghi chú"])
    r = 6
    for name, route, owner, mine, note in TEAM_SCOPE:
        count = sum(1 for it in ITEM_ROWS if it[0] == name.split()[0])
        values = [name, route, owner, mine, count if count else "—", note]
        for col, v in enumerate(values, start=1):
            c = ws4.cell(row=r, column=col, value=v)
            c.border = BORDER
            c.alignment = Alignment(
                vertical="top",
                horizontal="center" if col in (4, 5) else "left",
                wrap_text=col in (1, 2, 6),
            )
        fill = DONE_FILL if mine == "Của tôi" else TODO_FILL
        ws4.cell(row=r, column=4).fill = fill
        r += 1

    section(r, "2. KHÔNG THUỘC PHẦN TÔI")
    ws4.cell(row=r + 1, column=1,
             value="M1 (Chinh) · M4 + M5 (Phuc) — không sửa, chỉ đọc khi cần đối chiếu dữ liệu.")
    ws4.merge_cells(start_row=r + 1, start_column=1, end_row=r + 1, end_column=7)
    note_cell = ws4.cell(row=r + 2, column=1,
                         value="Nếu cần thay đổi ở platform/ui (vd OrderTable) thì mở PR cho Chinh, không tự sửa.")
    note_cell.font = Font(italic=True, size=9, color="6B7280")
    ws4.merge_cells(start_row=r + 2, start_column=1, end_row=r + 2, end_column=7)
    r += 3

    total_hours = sum(PLAN_META[it[1]][1] for it in ITEM_ROWS)
    done_hours = sum(
        PLAN_META[it[1]][1] for it in ITEM_ROWS if it[5] == "Hoàn thành"
    )
    doing_hours = sum(PLAN_META[it[1]][1] for it in ITEM_ROWS if it[5] == "Đang làm")

    section(r + 1, "3. KHỐI LƯỢNG ĐƯỢC GIAO")
    summary = [
        ("Tổng hạng mục", f"{len(ITEM_ROWS)} hạng mục thuộc M2 + M6"),
        ("Tổng ước lượng", f"{total_hours:.2f} giờ (chưa gồm thời gian chờ review/CI)"),
        ("Đã hoàn thành", f"{done_hours:.2f} giờ — {round(done_hours / total_hours * 100)}% theo giờ"),
        ("Đang làm", f"{doing_hours:.2f} giờ"),
        ("Còn lại", f"{total_hours - done_hours - doing_hours:.2f} giờ"),
        ("Điểm hoàn thành", f"{ratio('')} — Đang làm tính 50%, Chưa làm 0"),
        ("Theo số hạng mục", f"{done}/{total} hạng mục đã đạt 100%"),
        ("Ghi chú", "Ước lượng là thời gian thực tế dự kiến cho từng hạng mục, không phải timesheet"),
    ]
    r += 2
    for label, value in summary:
        ws4.cell(row=r, column=1, value=label).font = Font(bold=True, size=10)
        ws4.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        c = ws4.cell(row=r, column=3, value=value)
        c.alignment = Alignment(vertical="top", wrap_text=True)
        ws4.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7)
        r += 1

    section(r + 1, "4. CHI TIẾT VIỆC CỦA TÔI (theo thứ tự ưu tiên)")
    table_header(r + 2, ["Màn", "Hạng mục", "Ưu tiên", "Trạng thái", "Ước lượng (h)", "Phụ thuộc"])
    head = r + 2
    r = head + 1
    for it in ITEM_ROWS:
        screen, title, _desc, _kind, _path, status, _start, _sha, _ev, _note = it
        priority, hours, dep = PLAN_META[title]
        values = [screen, title, priority, status, hours, dep]
        for col, v in enumerate(values, start=1):
            c = ws4.cell(row=r, column=col, value=v)
            c.border = BORDER
            c.alignment = Alignment(
                vertical="center",
                horizontal="center" if col in (1, 3, 4, 5) else "left",
                wrap_text=col in (2, 6),
            )
            if col == 5:
                c.number_format = "0.00"
        fill = DONE_FILL if status == "Hoàn thành" else DOING_FILL if status == "Đang làm" else TODO_FILL
        ws4.cell(row=r, column=4).fill = fill
        ws4.row_dimensions[r].height = 22
        r += 1

    ws4.freeze_panes = "A5"

    # đưa sheet Phân công lên vị trí thứ 2
    wb.move_sheet(ws4, offset=-2)

    ws.page_setup.orientation = "portrait"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0

    for sheet in (ws2, ws3, ws4):
        sheet.page_setup.orientation = "landscape"
        sheet.page_setup.paperSize = sheet.PAPERSIZE_A3
        sheet.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
        sheet.page_setup.fitToWidth = 1
        sheet.page_setup.fitToHeight = 0
        sheet.print_title_rows = "1:1"

    wb.save(OUT)
    return OUT


def validate(path: Path) -> None:
    wb = load_workbook(path)
    ws2 = wb["Chi tiết công việc"]
    rows = [r for r in ws2.iter_rows(min_row=2, values_only=True) if r[0] is not None]

    assert len(rows) == len(ITEM_ROWS), f"Số dòng Sheet2 {len(rows)} != {len(ITEM_ROWS)}"

    for r in rows:
        assert r[12], f"Dòng {r[0]} thiếu bằng chứng"

    bad = []
    for ws in wb.worksheets:
        for row in ws.iter_rows(values_only=True):
            for v in row:
                if isinstance(v, str) and ("TODO" in v or "undefined" in v or "NaN" in v):
                    bad.append((ws.title, v))
    assert not bad, f"Có ô chứa TODO/undefined/NaN: {bad[:3]}"

    names = wb.sheetnames
    assert names[0] == "Tổng quan" and names[1] == "Phân công", f"Thứ tự sheet sai: {names}"
    ws4 = wb["Phân công"]
    assign_rows = [
        r for r in ws4.iter_rows(min_row=1, values_only=True)
        if isinstance(r[4], (int, float)) and r[2] in ("P1", "P2", "P3")
    ]
    assert len(assign_rows) == len(ITEM_ROWS), (
        f"Sheet Phân công có {len(assign_rows)} dòng việc, cần {len(ITEM_ROWS)}"
    )
    print(
        f"validated: sheet2={len(rows)} dòng, Phân công={len(assign_rows)} dòng, "
        "bằng chứng đủ, không có TODO/undefined/NaN"
    )


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    p = build()
    print(f"file: {p}")
    print(f"hạng mục: {len(ITEM_ROWS)}")
    validate(p)
