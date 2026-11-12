"""Sinh tài liệu Word (.docx) + PPTX từ docs/plan.md.

Chạy: python tools/build_docs.py
- Mermaid được render qua kroki.io, cache tại docs/diagrams/.
- .docx: tài liệu kỹ thuật đầy đủ, có mục lục, chèn sơ đồ.
- .pptx: deck 16:9 để họp review.
"""

from __future__ import annotations

import hashlib
import os
import re
import sys
import urllib.request
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

from pptx import Presentation
from pptx.dml.color import RGBColor as PRGB
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Emu, Inches, Pt as PPt

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DIAG = DOCS / "diagrams"
MD_PATH = Path(os.environ.get("DOC_MD") or (DOCS / "plan.md"))
DOCX_PATH = Path(
    os.environ.get("DOC_OUT") or (DOCS / "BaoCao-TangTruong-KeHoach-FE.docx")
)
PPTX_PATH = DOCS / "BaoCao-TangTruong-KeHoach-FE-Review.pptx"

# Cho phép đổi nội dung bìa bằng biến môi trường (dùng cho tài liệu khác)
DOC_KICKER = os.environ.get("DOC_KICKER", "TÀI LIỆU KẾ HOẠCH KỸ THUẬT")
DOC_TITLE = os.environ.get("DOC_TITLE", "Báo cáo tăng trưởng")
DOC_SUBTITLE = os.environ.get("DOC_SUBTITLE", "GMV · Đơn hàng · User mua hàng")
DOC_DESC = os.environ.get(
    "DOC_DESC",
    "Kế hoạch chia việc cho 3 FE theo 6 artboard của design\n"
    "mỗi người một màn hình, không conflict khi merge",
)
DOC_HEADER = os.environ.get(
    "DOC_HEADER", "Báo cáo tăng trưởng — Kế hoạch triển khai Frontend"
)
DOC_VERSION = os.environ.get("DOC_VERSION", "1.0 — Draft")
DOC_DATE = os.environ.get("DOC_DATE", "04/11/2026")
DOC_AUTHOR = os.environ.get("DOC_AUTHOR", "Tech Lead Frontend")
DOC_TEAM = os.environ.get(
    "DOC_TEAM", "Chinh (M1 + platform) · Long (M2 + M6) · Phuc (M4 + M5)"
)
DOC_STATUS = os.environ.get("DOC_STATUS", "Bản 2 — thay thế bản 1 (chia theo giả định, đã bỏ)")
DOC_BULLETS = os.environ.get(
    "DOC_BULLETS",
    "6 artboard: 1 hub + 3 màn chi tiết + 1 đặc tả số liệu|"
    "3 FE, mỗi người sở hữu trọn vẹn màn hình của mình|"
    "Còn 5 điểm cần chốt với BE (mục 11)",
).split("|")

NAVY = RGBColor(0x1F, 0x38, 0x64)
BLUE = RGBColor(0x2E, 0x54, 0x96)
INK = RGBColor(0x22, 0x22, 0x22)
GRAY = RGBColor(0x6B, 0x72, 0x80)
CODE_BG = "F3F4F6"
HDR_BG = "1F3864"
ALT_BG = "F5F7FA"

PNAVY = PRGB(0x1F, 0x38, 0x64)
PBLUE = PRGB(0x2E, 0x54, 0x96)
PACCENT = PRGB(0xF5, 0x9E, 0x0B)
PINK = PRGB(0x33, 0x33, 0x33)
PGRAY = PRGB(0x6B, 0x72, 0x80)
PLIGHT = PRGB(0xF5, 0xF7, 0xFA)


# ---------------------------------------------------------------- mermaid ---
def render_mermaid(code: str) -> Path | None:
    DIAG.mkdir(parents=True, exist_ok=True)
    digest = hashlib.md5(code.strip().encode()).hexdigest()[:12]
    out = DIAG / f"mmd-{digest}.png"
    if out.exists() and out.stat().st_size > 1000:
        return out
    for _ in range(3):
        try:
            req = urllib.request.Request(
                "https://kroki.io/mermaid/png?scale=2",
                data=code.strip().encode("utf-8"),
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Content-Type": "text/plain",
                },
            )
            with urllib.request.urlopen(req, timeout=45) as r:
                out.write_bytes(r.read())
            if out.stat().st_size > 1000:
                return out
        except Exception as exc:  # pragma: no cover
            print(f"  ! kroki lỗi: {exc}")
    return None


# --------------------------------------------------------------- md parse ---
INLINE_RE = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\*[^*]+\*)")


def parse_markdown(text: str) -> list[dict]:
    lines = text.splitlines()
    blocks: list[dict] = []
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        if not line.strip():
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            blocks.append({"t": "h", "level": len(m.group(1)), "text": m.group(2).strip()})
            i += 1
            continue

        if line.strip().startswith("```"):
            lang = line.strip()[3:].strip()
            body: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                body.append(lines[i].rstrip("\n"))
                i += 1
            i += 1
            blocks.append({"t": "code", "lang": lang, "text": "\n".join(body)})
            continue

        if line.lstrip().startswith("|"):
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                rows.append(cells)
                i += 1
            if len(rows) >= 2 and re.match(r"^[\s:\-|]+$", "|".join(rows[1])):
                header, body_rows = rows[0], rows[2:]
            else:
                header, body_rows = rows[0], rows[1:]
            blocks.append({"t": "table", "header": header, "rows": body_rows})
            continue

        if re.match(r"^[-*]\s+", line):
            items = []
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i].strip()):
                items.append(re.sub(r"^[-*]\s+", "", lines[i].strip()))
                i += 1
            blocks.append({"t": "ul", "items": items})
            continue

        if re.match(r"^\d+\.\s+", line.strip()):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i].strip()))
                i += 1
            blocks.append({"t": "ol", "items": items})
            continue

        para = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
            r"^(#{1,4}\s|[-*]\s|\d+\.\s|\||```)", lines[i].strip()
        ):
            para.append(lines[i].strip())
            i += 1
        blocks.append({"t": "p", "text": " ".join(para)})

    return blocks


# ------------------------------------------------------------ docx helpers ---
def shade(el, fill: str) -> None:
    pr = el.get_or_add_pPr() if hasattr(el, "get_or_add_pPr") else el.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    pr.append(shd)


def para_shade(p, fill: str) -> None:
    shade(p._p, fill)


def cell_shade(cell, fill: str) -> None:
    shade(cell._tc, fill)


def table_borders(table, color: str = "D0D5DD") -> None:
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), color)
        borders.append(el)
    tblPr.append(borders)


def set_repeat_header(row) -> None:
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trPr.append(el)


def add_inline(paragraph, text: str, size: float = 10.5, color=INK, mono_size: float | None = None) -> None:
    for part in INLINE_RE.split(text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith("`") and part.endswith("`"):
            run = paragraph.add_run(part[1:-1])
            run.font.name = "Consolas"
            run._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
            run.font.size = Pt(mono_size or size - 1.2)
            run.font.color.rgb = RGBColor(0xB4, 0x25, 0x1E)
        elif part.startswith("*") and part.endswith("*") and len(part) > 2:
            run = paragraph.add_run(part[1:-1])
            run.italic = True
        else:
            run = paragraph.add_run(part)
        run.font.size = run.font.size or Pt(size)
        if run.font.color.rgb is None:
            run.font.color.rgb = color
    return


def add_field(paragraph, instr: str, placeholder: str = "1") -> None:
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = instr
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    t = OxmlElement("w:t")
    t.text = placeholder
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    for el in (fld_begin, it, fld_sep, t, fld_end):
        run._r.append(el)


def bookmark(paragraph, name: str, bid: int) -> None:
    start = OxmlElement("w:bookmarkStart")
    start.set(qn("w:id"), str(bid))
    start.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"), str(bid))
    paragraph._p.insert(0, start)
    paragraph._p.append(end)


def add_anchor_link(paragraph, anchor: str, text: str, size: float, bold: bool = False) -> None:
    link = OxmlElement("w:hyperlink")
    link.set(qn("w:anchor"), anchor)
    run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    if bold:
        rpr.append(OxmlElement("w:b"))
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "2E5496")
    rpr.append(color)
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), str(int(size * 2)))
    rpr.append(sz)
    run.append(rpr)
    t = OxmlElement("w:t")
    t.set(qn("xml:space"), "preserve")
    t.text = text
    run.append(t)
    link.append(run)
    paragraph._p.append(link)


# ----------------------------------------------------------------- build docx ---
def cm_to_twips(cm: float) -> int:
    return int(round(cm * 567))


def longest_token(text: str) -> int:
    return max((len(t) for t in re.split(r"[\s/]+", text) if t), default=1)


def compute_col_widths(header, rows, content_w: float) -> list[float]:
    """Chia cột: header không xuống dòng, cột dài được ưu tiên, còn lại co lại."""
    ncol = len(header)
    margin = 0.34  # tổng lề trái + phải của một cell (cm)
    min_w, probe = [], []
    for c in range(ncol):
        vals = [r[c] for r in rows if c < len(r)]
        hlen = len(header[c])
        maxlen = max([hlen] + [len(v) for v in vals])
        token = max([longest_token(header[c])] + [longest_token(v) for v in vals])
        # header phải nằm gọn một dòng
        m = max(1.0, hlen * 0.19 + margin)
        # token dài không được vỡ quá xấu, nhưng chặn trần để không chiếm hết chỗ
        m = max(m, min(3.1, token * 0.175 + margin))
        min_w.append(m)
        probe.append(max(m, min(maxlen, 48) * 0.15 + margin))

    if sum(min_w) >= content_w:
        f = content_w / sum(min_w)
        return [w * f for w in min_w]

    widths = probe[:]
    for _ in range(8):
        total = sum(widths)
        if total <= content_w + 0.01:
            break
        excess = sum(w - m for w, m in zip(widths, min_w))
        if excess <= 0.001:
            break
        factor = (total - content_w) / excess
        widths = [max(m, w - (w - m) * factor) for w, m in zip(widths, min_w)]

    total = sum(widths)
    if total < content_w - 0.01:
        extra = content_w - total
        share = [max(0.0, w - m) for w, m in zip(widths, min_w)]
        s = sum(share) or 1.0
        widths = [w + extra * sh / s for w, sh in zip(widths, share)]
    return widths


def apply_table_layout(table, widths_cm: list[float]) -> None:
    tbl = table._tbl
    tblPr = tbl.tblPr
    for el in tblPr.findall(qn("w:tblW")):
        tblPr.remove(el)
    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:w"), str(cm_to_twips(sum(widths_cm))))
    tblW.set(qn("w:type"), "dxa")
    tblPr.append(tblW)

    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)

    mar = OxmlElement("w:tblCellMar")
    for side, w in (("top", 0.06), ("left", 0.17), ("bottom", 0.06), ("right", 0.17)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(cm_to_twips(w)))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tblPr.append(mar)

    for i, w in enumerate(widths_cm):
        table.columns[i].width = Cm(w)


def build_docx(blocks: list[dict]) -> None:
    doc = Document()

    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.top_margin = Cm(2.0)
    sec.bottom_margin = Cm(1.8)
    sec.left_margin = Cm(1.9)
    sec.right_margin = Cm(1.9)
    content_w = 21 - 3.8

    st = doc.styles["Normal"]
    st.font.name = "Calibri"
    st.font.size = Pt(10.5)
    st.font.color.rgb = INK
    st.paragraph_format.line_spacing = 1.18
    st.paragraph_format.space_after = Pt(5)

    specs = {
        1: (15.5, NAVY, 18, 6, True),
        2: (12.5, BLUE, 14, 4, True),
        3: (11, RGBColor(0x22, 0x22, 0x22), 10, 3, True),
        4: (10.5, RGBColor(0x44, 0x44, 0x44), 8, 2, False),
    }
    for lvl, (size, color, before, after, rule) in specs.items():
        hs = doc.styles[f"Heading {lvl}"]
        hs.font.name = "Calibri"
        hs.font.size = Pt(size)
        hs.font.bold = True
        hs.font.color.rgb = color
        hs.paragraph_format.space_before = Pt(before)
        hs.paragraph_format.space_after = Pt(after)
        hs.paragraph_format.keep_with_next = True
        if lvl == 1:
            pbf = OxmlElement("w:pBdr")
            bottom = OxmlElement("w:bottom")
            bottom.set(qn("w:val"), "single")
            bottom.set(qn("w:sz"), "6")
            bottom.set(qn("w:color"), "D0D5DD")
            pbf.append(bottom)
            hs.element.get_or_add_pPr().append(pbf)

    # header / footer
    hp = sec.header.paragraphs[0]
    hp.text = DOC_HEADER
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    for r in hp.runs:
        r.font.size = Pt(8)
        r.font.color.rgb = GRAY

    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("Trang ")
    r.font.size = Pt(8)
    r.font.color.rgb = GRAY
    add_field(fp, " PAGE ")
    r2 = fp.add_run(" / ")
    r2.font.size = Pt(8)
    r2.font.color.rgb = GRAY
    add_field(fp, " NUMPAGES ")
    for run in fp.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = GRAY

    # ---------------- cover
    for _ in range(2):
        doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run(DOC_KICKER)
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = BLUE
    r.font.name = "Calibri"

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    r = p.add_run(DOC_TITLE)
    r.font.size = Pt(32)
    r.font.bold = True
    r.font.color.rgb = NAVY

    p = doc.add_paragraph()
    r = p.add_run(DOC_SUBTITLE)
    r.font.size = Pt(16)
    r.font.color.rgb = GRAY

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    r = p.add_run(DOC_DESC)
    r.font.size = Pt(11.5)
    r.font.color.rgb = INK
    p.paragraph_format.line_spacing = 1.4

    doc.add_paragraph()
    meta = [
        ("Phiên bản", DOC_VERSION),
        ("Ngày", DOC_DATE),
        ("Người lập", DOC_AUTHOR),
        ("Team", DOC_TEAM),
        ("Stack", "Next.js 15 App Router · TypeScript strict · Tailwind · shadcn/ui · Recharts · zod"),
        ("Trạng thái", DOC_STATUS),
    ]
    t = doc.add_table(rows=0, cols=2)
    t.autofit = False
    for k, v in meta:
        row = t.add_row()
        row.cells[0].width = Cm(3.4)
        row.cells[1].width = Cm(content_w - 3.4)
        c0 = row.cells[0].paragraphs[0]
        rr = c0.add_run(k)
        rr.font.size = Pt(9)
        rr.font.bold = True
        rr.font.color.rgb = GRAY
        c1 = row.cells[1].paragraphs[0]
        rr = c1.add_run(v)
        rr.font.size = Pt(9.5)

    # điểm chính trên bìa
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    r = p.add_run("NỘI DUNG CHÍNH")
    r.font.size = Pt(9)
    r.font.bold = True
    r.font.color.rgb = BLUE
    for line in DOC_BULLETS:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Cm(0.4)
        p.paragraph_format.first_line_indent = Cm(-0.4)
        r = p.add_run("—  ")
        r.font.size = Pt(10.5)
        r.font.color.rgb = GRAY
        r = p.add_run(line)
        r.font.size = Pt(10.5)
        r.font.color.rgb = INK

    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # ---------------- TOC (manual, có bookmark + link nội bộ)
    p = doc.add_paragraph()
    r = p.add_run("MỤC LỤC")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = NAVY

    for bi, b in enumerate(blocks):
        if b["t"] != "h" or b["level"] > 2:
            continue
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.1
        if b["level"] == 1:
            p.paragraph_format.space_before = Pt(7)
            add_anchor_link(p, f"sec{bi}", b["text"], 10.5, bold=True)
        else:
            p.paragraph_format.left_indent = Cm(0.7)
            add_anchor_link(p, f"sec{bi}", b["text"], 9.8)

    note = doc.add_paragraph()
    note.paragraph_format.space_before = Pt(10)
    r = note.add_run("Bấm vào tiêu đề để nhảy tới mục tương ứng (giữ Ctrl khi bấm).")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = GRAY

    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # ---------------- body
    for bi, b in enumerate(blocks):
        kind = b["t"]

        if kind == "h":
            lvl = min(b["level"], 4)
            hp = doc.add_heading(b["text"], level=lvl)
            bookmark(hp, f"sec{bi}", bi + 100)

        elif kind == "p":
            p = doc.add_paragraph()
            add_inline(p, b["text"])
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        elif kind == "ul":
            for item in b["items"]:
                p = doc.add_paragraph(style="List Bullet")
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.left_indent = Cm(0.6)
                add_inline(p, item)

        elif kind == "ol":
            for idx, item in enumerate(b["items"], start=1):
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.left_indent = Cm(0.85)
                p.paragraph_format.first_line_indent = Cm(-0.55)
                r = p.add_run(f"{idx}.\t")
                r.font.size = Pt(10.5)
                add_inline(p, item)

        elif kind == "code":
            if b["lang"] == "mermaid":
                img = render_mermaid(b["text"])
                if img:
                    p = doc.add_paragraph()
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p.paragraph_format.space_before = Pt(8)
                    p.paragraph_format.space_after = Pt(10)
                    pic = p.add_run().add_picture(str(img), width=Cm(content_w * 0.96))
                    # chặn chiều cao để sơ đồ dọc không chiếm nhiều trang
                    max_h = Cm(17.0)
                    if pic.height > max_h:
                        ratio = max_h / pic.height
                        pic.width = int(pic.width * ratio)
                        pic.height = max_h
                else:
                    p = doc.add_paragraph()
                    para_shade(p, CODE_BG)
                    run = p.add_run(b["text"])
                    run.font.name = "Consolas"
                    run.font.size = Pt(8)
            else:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(8)
                p.paragraph_format.left_indent = Cm(0.15)
                para_shade(p, CODE_BG)
                lines = b["text"].split("\n")
                for idx, ln in enumerate(lines):
                    run = p.add_run(ln)
                    run.font.name = "Consolas"
                    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
                    run.font.size = Pt(7.9)
                    run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
                    if idx < len(lines) - 1:
                        run.add_break()

        elif kind == "table":
            header, rows = b["header"], b["rows"]
            ncol = len(header)
            table = doc.add_table(rows=1, cols=ncol)
            table.style = "Table Grid"
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False
            table_borders(table)

            widths = compute_col_widths(header, rows, content_w)
            apply_table_layout(table, widths)

            hdr = table.rows[0]
            set_repeat_header(hdr)
            for c, txt in enumerate(header):
                cell = hdr.cells[c]
                cell.width = Cm(widths[c])
                cell_shade(cell, HDR_BG)
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(1)
                r = p.add_run(txt)
                r.font.size = Pt(8.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

            for ri, rowvals in enumerate(rows):
                row = table.add_row()
                for c in range(ncol):
                    cell = row.cells[c]
                    cell.width = Cm(widths[c])
                    txt = rowvals[c] if c < len(rowvals) else ""
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(1)
                    p.paragraph_format.line_spacing = 1.05
                    add_inline(p, txt, size=8.6, mono_size=7.6)
                    if ri % 2 == 1:
                        cell_shade(cell, ALT_BG)

            doc.add_paragraph().paragraph_format.space_after = Pt(2)

    doc.core_properties.title = "Báo cáo tăng trưởng — Kế hoạch triển khai Frontend"
    doc.core_properties.author = "Tech Lead Frontend"
    doc.core_properties.subject = "Chia việc 3 FE trên Next.js 15 App Router"

    doc.save(DOCX_PATH)
    print(f"  -> {DOCX_PATH.name}")


# -------------------------------------------------------------------- pptx ---
def add_slide(prs, kicker: str, title: str, page: int):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    bar = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(0.14), Inches(7.5))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PNAVY
    bar.line.fill.background()

    tb = slide.shapes.add_textbox(Inches(0.72), Inches(0.34), Inches(11.9), Inches(0.35))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = kicker.upper()
    r.font.size = PPt(10.5)
    r.font.bold = True
    r.font.color.rgb = PBLUE
    r.font.name = "Calibri"

    tb = slide.shapes.add_textbox(Inches(0.72), Inches(0.66), Inches(11.9), Inches(0.95))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = title
    r.font.size = PPt(28)
    r.font.bold = True
    r.font.color.rgb = PNAVY
    r.font.name = "Calibri"

    rule = slide.shapes.add_shape(1, Inches(0.74), Inches(1.62), Inches(1.15), Inches(0.055))
    rule.fill.solid()
    rule.fill.fore_color.rgb = PACCENT
    rule.line.fill.background()

    tb = slide.shapes.add_textbox(Inches(0.72), Inches(7.05), Inches(8), Inches(0.3))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "Báo cáo tăng trưởng · Kế hoạch triển khai FE"
    r.font.size = PPt(8.5)
    r.font.color.rgb = PGRAY

    tb = slide.shapes.add_textbox(Inches(11.8), Inches(7.05), Inches(0.9), Inches(0.3))
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    r = p.add_run()
    r.text = f"{page:02d}"
    r.font.size = PPt(9)
    r.font.bold = True
    r.font.color.rgb = PNAVY
    return slide


def bullets(slide, items, left, top, width, height, size=14, space=8, color=PINK):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    first = True
    for item in items:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = PPt(space)
        if isinstance(item, tuple):
            text, level = item
        else:
            text, level = item, 0
        p.level = level
        r = p.add_run()
        r.text = ("•  " if level == 0 else "–  ") + text
        r.font.size = PPt(size)
        r.font.name = "Calibri"
        r.font.color.rgb = color
    return tb


def table_no_borders(table) -> None:
    from pptx.oxml.ns import nsdecls
    from pptx.oxml import parse_xml

    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            for tag in ("lnB", "lnT", "lnR", "lnL"):
                el = parse_xml(f'<a:{tag} {nsdecls("a")} w="0"><a:noFill/></a:{tag}>')
                tcPr.insert(0, el)


def slide_table(slide, header, rows, left, top, width, col_w=None, size=11,
                header_size=11.5, header_h=0.42, row_h=0.5, row_heights=None):
    nrows, ncols = len(rows) + 1, len(header)
    height = Inches(header_h + row_h * len(rows))
    shape = slide.shapes.add_table(nrows, ncols, Inches(left), Inches(top), Inches(width), height)
    table = shape.table
    table.first_row = False
    table.horz_banding = False
    if col_w:
        total = sum(col_w)
        for i, w in enumerate(col_w):
            table.columns[i].width = Emu(int(Inches(width) * w / total))
    table.rows[0].height = Inches(header_h)
    for i in range(1, nrows):
        h = row_heights[i - 1] if row_heights else row_h
        table.rows[i].height = Inches(h)
    for c, txt in enumerate(header):
        cell = table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = PNAVY
        cell.margin_left = Inches(0.08)
        cell.margin_right = Inches(0.06)
        cell.margin_top = Inches(0.03)
        cell.margin_bottom = Inches(0.03)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = cell.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = txt
        r.font.size = PPt(header_size)
        r.font.bold = True
        r.font.color.rgb = PRGB(0xFF, 0xFF, 0xFF)
        r.font.name = "Calibri"
    for ri, row in enumerate(rows, start=1):
        for c, txt in enumerate(row):
            cell = table.cell(ri, c)
            cell.fill.solid()
            cell.fill.fore_color.rgb = PLIGHT if ri % 2 == 0 else PRGB(0xFF, 0xFF, 0xFF)
            cell.margin_left = Inches(0.08)
            cell.margin_right = Inches(0.06)
            cell.margin_top = Inches(0.02)
            cell.margin_bottom = Inches(0.02)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf = cell.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            r = p.add_run()
            r.text = txt
            r.font.size = PPt(size)
            r.font.color.rgb = PINK
            r.font.name = "Calibri"
    table_no_borders(table)
    return table


def code_card(slide, code, left, top, width, height, size=11):
    box = slide.shapes.add_shape(5, Inches(left), Inches(top), Inches(width), Inches(height))
    box.fill.solid()
    box.fill.fore_color.rgb = PRGB(0x1E, 0x29, 0x3B)
    box.line.fill.background()
    box.shadow.inherit = False
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = Inches(0.24)
    tf.margin_right = Inches(0.18)
    tf.margin_top = Inches(0.2)
    tf.margin_bottom = Inches(0.14)
    first = True
    for ln in code.split("\n"):
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = PP_ALIGN.LEFT
        p.space_after = PPt(0)
        p.line_spacing = 1.08
        r = p.add_run()
        r.text = ln if ln else " "
        r.font.name = "Consolas"
        r.font.size = PPt(size)
        r.font.color.rgb = PRGB(0xE2, 0xE8, 0xF0)
    return box


def build_pptx() -> None:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # 1 — cover
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg = s.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = PNAVY
    bg.line.fill.background()

    acc = s.shapes.add_shape(1, Inches(0.9), Inches(3.02), Inches(1.3), Inches(0.07))
    acc.fill.solid()
    acc.fill.fore_color.rgb = PACCENT
    acc.line.fill.background()

    tb = s.shapes.add_textbox(Inches(0.9), Inches(1.5), Inches(11), Inches(0.4))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "KẾ HOẠCH KỸ THUẬT · REVIEW NỘI BỘ"
    r.font.size = PPt(12)
    r.font.bold = True
    r.font.color.rgb = PRGB(0x9D, 0xB4, 0xD8)

    tb = s.shapes.add_textbox(Inches(0.9), Inches(1.95), Inches(11.5), Inches(1.1))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "Báo cáo tăng trưởng"
    r.font.size = PPt(48)
    r.font.bold = True
    r.font.color.rgb = PRGB(0xFF, 0xFF, 0xFF)

    tb = s.shapes.add_textbox(Inches(0.9), Inches(3.25), Inches(11), Inches(0.6))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "Chia việc cho 3 FE trên Next.js 15 App Router — mỗi người một slice độc lập"
    r.font.size = PPt(18)
    r.font.color.rgb = PRGB(0xC9, 0xD6, 0xEA)

    tb = s.shapes.add_textbox(Inches(0.9), Inches(5.6), Inches(11), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True
    lines = [
        "Doanh thu sàn · Đơn hàng · User mua hàng",
        "Phiên bản 1.0 — Draft · 04/11/2026 · Tech Lead Frontend",
        "Trạng thái: chờ chốt Figma và câu hỏi với BE trước khi code",
    ]
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = PPt(4)
        r = p.add_run()
        r.text = ln
        r.font.size = PPt(11 if i else 13)
        r.font.color.rgb = PRGB(0xE6, 0xEC, 0xF6) if i == 0 else PRGB(0x8F, 0xA6, 0xC8)

    # 2 — mục tiêu & phạm vi
    s = add_slide(prs, "Bối cảnh", "Mục tiêu và phạm vi", 2)
    bullets(s, [
        ("Một màn hình /growth: GMV sàn, đơn hàng, user mua hàng", 0),
        ("3 FE code song song trên cùng repo, merge không conflict", 0),
        ("Có sẵn điểm cắm API thật, BE bàn giao không phải sửa UI", 0),
    ], 0.75, 2.0, 5.6, 2.2, size=14, space=12)

    slide_table(s, ["Hạng mục", "Nội dung"], [
        ["Trong phạm vi", "1 trang, filter kỳ + sàn + granularity, 4 KPI, 3 chart, 3 bảng, export CSV"],
        ["Ngoài phạm vi", "Phân quyền chi tiết, realtime, mobile < 768px"],
        ["Stack", "Next.js 15 App Router, TS strict, Tailwind, shadcn/ui, Recharts, zod"],
    ], 0.75, 3.55, 11.8, col_w=[1.4, 6.0], size=11.5, header_h=0.42, row_h=0.62)

    # 3 — 3 quyết định
    s = add_slide(prs, "Kiến trúc", "Ba quyết định then chốt", 3)
    cards = [
        ("01", "Parallel Routes", "Mỗi slot là một folder sở hữu riêng, có loading + error riêng, stream độc lập. layout.tsx chỉ FE-A viết một lần."),
        ("02", "Data layer tách khỏi UI", "Server Component → source → mapper. Đổi mock sang API thật là đổi một chỗ, UI không đổi một dòng."),
        ("03", "Một owner một file", "Chặn bằng CODEOWNERS + ESLint boundaries. Conflict đỏ ở CI, không phải ở buổi merge."),
    ]
    x = 0.75
    for num, head, body in cards:
        card = s.shapes.add_shape(5, Inches(x), Inches(2.05), Inches(3.72), Inches(3.5))
        card.fill.solid()
        card.fill.fore_color.rgb = PLIGHT
        card.line.color.rgb = PRGB(0xDD, 0xE2, 0xEA)
        card.shadow.inherit = False
        tb = s.shapes.add_textbox(Inches(x + 0.28), Inches(2.3), Inches(3.2), Inches(0.5))
        p = tb.text_frame.paragraphs[0]
        r = p.add_run()
        r.text = num
        r.font.size = PPt(24)
        r.font.bold = True
        r.font.color.rgb = PACCENT

        tb = s.shapes.add_textbox(Inches(x + 0.28), Inches(2.95), Inches(3.2), Inches(0.6))
        p = tb.text_frame.paragraphs[0]
        p.word_wrap = True
        r = p.add_run()
        r.text = head
        r.font.size = PPt(15)
        r.font.bold = True
        r.font.color.rgb = PNAVY

        tb = s.shapes.add_textbox(Inches(x + 0.28), Inches(3.6), Inches(3.15), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = body
        r.font.size = PPt(11.5)
        r.font.color.rgb = PGRAY
        x += 3.94

    # 4 — phân bổ
    s = add_slide(prs, "Phân rã công việc", "Ba slice, ba người, không giao nhau", 4)
    slide_table(s, ["Slice", "Phạm vi", "Sở hữu", "Est"], [
        ["FE-A", "Shell & Filter — layout, grid, FilterBar, URL contract, UI kit, data source, revalidate", "app/.../growth/layout.tsx, _components/, src/platform/**, src/contracts/**", "M → L"],
        ["FE-B", "Revenue & Growth — KPI GMV, growth chart, so kỳ trước, doanh thu theo sàn, export", "@revenue/, src/features/revenue/**", "L"],
        ["FE-C", "Orders & Buyers — KPI đơn + AOV, funnel, new/returning, cohort, top buyers, export", "@orders/, src/features/orders/**, src/features/buyers/**", "L"],
    ], 0.75, 2.0, 11.8, col_w=[0.8, 4.6, 4.4, 0.7], size=10.5, header_h=0.45, row_h=0.85)
    tb = s.shapes.add_textbox(Inches(0.75), Inches(6.35), Inches(11.8), Inches(0.5))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "FE-A là critical path: merge layout + contract xong D1–D2 thì B và C mới bắt đầu code UI."
    r.font.size = PPt(11)
    r.font.italic = True
    r.font.color.rgb = PBLUE

    # 5 — load flow
    s = add_slide(prs, "Luồng chạy", "Hai slot fetch song song, lỗi cô lập", 5)
    img = DIAG / "flow-load.png"
    if img.exists():
        pic = s.shapes.add_picture(str(img), Inches(0.75), Inches(1.95), width=Inches(9.3))
        if pic.height > Inches(5.2):
            ratio = Inches(5.2) / pic.height
            pic.width = int(pic.width * ratio)
            pic.height = Inches(5.2)
    tb = s.shapes.add_textbox(Inches(10.35), Inches(2.1), Inches(2.6), Inches(3.6))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, ln in enumerate(["layout.tsx flush sớm", "mỗi slot có loading.tsx", "error.tsx cô lập lỗi", "C lỗi không trắng trang"]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = PPt(10)
        r = p.add_run()
        r.text = "•  " + ln
        r.font.size = PPt(11.5)
        r.font.color.rgb = PGRAY

    # 6 — data flow
    s = add_slide(prs, "Kiến trúc dữ liệu", "Đường đi dữ liệu và chỗ cắm BE", 6)
    img = DIAG / "flow-data-lr.png"
    if img.exists():
        pic = s.shapes.add_picture(str(img), Inches(0.75), Inches(1.95), width=Inches(11.8))
        if pic.height > Inches(3.9):
            ratio = Inches(3.9) / pic.height
            pic.width = int(pic.width * ratio)
            pic.height = Inches(3.9)
            pic.left = Emu(int((Inches(13.333) - pic.width) / 2))
    tb = s.shapes.add_textbox(Inches(0.75), Inches(5.15), Inches(11.8), Inches(1.0))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, ln in enumerate([
        "mock: revenue.mock.ts đọc fixture.ts — chạy được khi chưa có BE",
        "api: revenue.http.ts + revenue.mapper.ts — thêm 2 file, không sửa file cũ",
        "cache 1 tầng: unstable_cache, revalidate 60s, tag theo slice",
    ]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = PPt(5)
        r = p.add_run()
        r.text = "·  " + ln
        r.font.size = PPt(11)
        r.font.color.rgb = PGRAY

    tb = s.shapes.add_textbox(Inches(0.75), Inches(6.45), Inches(11.8), Inches(0.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = "Component chỉ nhận view model. Đổi nguồn mock → api là đổi đúng một file trong server/, toàn bộ UI giữ nguyên."
    r.font.size = PPt(11.5)
    r.font.italic = True
    r.font.color.rgb = PBLUE

    # 7 — hợp đồng
    s = add_slide(prs, "Hợp đồng", "Ranh giới dữ liệu giữa ba người", 7)
    slide_table(s, ["Vùng", "Owner", "Người khác được làm gì"], [
        ["src/contracts/**, src/platform/**", "FE-A", "Chỉ import, không sửa"],
        ["layout.tsx, _components/**", "FE-A", "Chỉ đọc — muốn đổi thì PR 3 dòng"],
        ["@revenue/, src/features/revenue/**", "FE-B", "Không ai khác chạm"],
        ["@orders/, orders/**, buyers/**", "FE-C", "Không ai khác chạm"],
        ["parseFilters()", "FE-A", "Bắt buộc dùng — cấm tự parse searchParams"],
    ], 0.75, 2.0, 11.8, col_w=[4.2, 1.3, 5.0], size=11, row_h=0.55)
    tb = s.shapes.add_textbox(Inches(0.75), Inches(5.9), Inches(11.8), Inches(1.0))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = "Quy tắc: chỉ thêm field optional, không đổi tên, không đổi kiểu, không đổi đơn vị. Mọi thay đổi contract là PR riêng, hai người review."
    r.font.size = PPt(12)
    r.font.color.rgb = PINK

    # 8 — điểm cắm BE
    s = add_slide(prs, "Tích hợp", "BE xong thì nhét dữ liệu vào đâu", 8)
    code_card(s, """// server/source.ts
export const revenueSource: RevenueSource =
  pickSource(revenueMockSource, revenueHttpSource);

// .env khi BE bàn giao
DATA_SOURCE=api
REPORT_API_BASE_URL=https://api...""", 0.75, 2.0, 5.9, 2.55, size=11)

    steps = [
        ("1", "Viết <x>.http.ts implement <X>Source"),
        ("2", "Viết <x>.mapper.ts: snake_case → view model"),
        ("3", "Đổi DATA_SOURCE=api, chạy contract test"),
        ("4", "Xác nhận page và component không đổi một dòng"),
    ]
    y = 2.0
    for num, txt in steps:
        circ = s.shapes.add_shape(9, Inches(7.0), Inches(y + 0.06), Inches(0.36), Inches(0.36))
        circ.fill.solid()
        circ.fill.fore_color.rgb = PNAVY
        circ.line.fill.background()
        p = circ.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = num
        r.font.size = PPt(11)
        r.font.bold = True
        r.font.color.rgb = PRGB(0xFF, 0xFF, 0xFF)

        tb = s.shapes.add_textbox(Inches(7.5), Inches(y), Inches(4.9), Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = txt
        r.font.size = PPt(12.5)
        r.font.color.rgb = PINK
        y += 0.72

    tb = s.shapes.add_textbox(Inches(7.0), Inches(5.15), Inches(5.5), Inches(1.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = "Không ai phải sửa file chung → ba người vẫn merge độc lập sau khi BE xong."
    r.font.size = PPt(11.5)
    r.font.italic = True
    r.font.color.rgb = PBLUE

    # 3 con số chốt hạ
    stats = [("2", "file phải viết", "http.ts + mapper.ts"), ("1", "biến môi trường", "DATA_SOURCE=api"), ("0", "dòng UI đổi", "page và component giữ nguyên")]
    x = 0.75
    for num, label, sub in stats:
        card = s.shapes.add_shape(5, Inches(x), Inches(5.95), Inches(3.72), Inches(0.82))
        card.fill.solid()
        card.fill.fore_color.rgb = PLIGHT
        card.line.color.rgb = PRGB(0xDD, 0xE2, 0xEA)
        card.shadow.inherit = False
        tb = s.shapes.add_textbox(Inches(x + 0.2), Inches(6.03), Inches(0.7), Inches(0.5))
        p = tb.text_frame.paragraphs[0]
        r = p.add_run()
        r.text = num
        r.font.size = PPt(22)
        r.font.bold = True
        r.font.color.rgb = PACCENT

        tb = s.shapes.add_textbox(Inches(x + 0.85), Inches(6.03), Inches(2.7), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = label
        r.font.size = PPt(11.5)
        r.font.bold = True
        r.font.color.rgb = PNAVY
        p2 = tf.add_paragraph()
        r = p2.add_run()
        r.text = sub
        r.font.size = PPt(9.5)
        r.font.color.rgb = PGRAY
        x += 3.94

    # 9 — github
    s = add_slide(prs, "Quy trình", "GitHub, CI và thứ tự merge", 9)
    bullets(s, [
        ("Branch: feat/fe-a-shell · feat/fe-b-revenue · feat/fe-c-orders", 0),
        ("A merge trước, B/C rebase lên main rồi code UI", 0),
        ("CODEOWNERS theo folder, PR ≤ 400 dòng diff", 0),
        ("CI: tsc --noEmit · eslint boundaries · vitest · next build", 0),
        ("PR template có checklist “không sửa file ngoài scope”", 0),
    ], 0.75, 2.0, 5.7, 3.6, size=13, space=13)

    code_card(s, """# eslint.config.mjs
'boundaries/element-types': ['error', {
  default: 'disallow',
  rules: [
    { from: 'feat-revenue',
      allow: ['contracts', 'platform',
              'feat-revenue'] },
    { from: 'feat-orders',
      allow: ['contracts', 'platform',
              'feat-orders'] },
  ],
}]""", 6.85, 2.0, 5.7, 3.3, size=10)

    # 10 — timeline
    s = add_slide(prs, "Kế hoạch", "Hai tuần, theo phụ thuộc", 10)
    slide_table(s, ["Ngày", "FE-A", "FE-B", "FE-C"], [
        ["D1", "Contract + layout + 2 slot rỗng (merge)", "Review contract", "Review contract"],
        ["D2", "UI kit, http, pickSource, CSV", "Scaffold server + fixture", "Scaffold server + fixture"],
        ["D3–D4", "Chart frame, DataTable, error/empty", "KPI + growth chart", "Funnel + buyer mix"],
        ["D5", "FilterBar client + useTransition", "Marketplace + export", "Cohort + top + export"],
        ["D6–D7", "Hỗ trợ, review PR", "Test mapper + state", "Test mapper + state"],
        ["D8", "Freeze contract", "Bug fix", "Bug fix"],
        ["D9–D10", "Review chéo, bàn giao BE", "Review chéo", "Review chéo"],
    ], 0.75, 2.0, 11.8, col_w=[0.9, 3.6, 3.2, 3.2], size=10.5, header_h=0.42, row_h=0.5)
    tb = s.shapes.add_textbox(Inches(0.75), Inches(5.75), Inches(11.8), Inches(0.4))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "Không ai code UI trước khi A merge contract."
    r.font.size = PPt(11)
    r.font.italic = True
    r.font.color.rgb = PBLUE

    # 11 — rủi ro
    s = add_slide(prs, "Rủi ro", "Ba điểm dễ conflict và cách chặn", 11)
    slide_table(s, ["Điểm", "Vì sao chết người", "Cách chặn"], [
        ["layout.tsx / grid", "Ba người cùng chỉnh cột, spacing → merge nào cũng đỏ", "CODEOWNERS @fe-a; B/C chỉ đặt component vào slot; grid dùng grid-area đặt tên"],
        ["Filter shape", "Tự parse searchParams → lệch ngày, lệch default range, số liệu không khớp", "Chỉ parseFilters() được export; test chung do A viết"],
        ["UI kit / tokens", "Ai cũng sửa KpiCard → prop lệch, component bị fork", "src/platform/ui độc quyền A; mở rộng bằng variant, không fork"],
    ], 0.75, 2.0, 11.8, col_w=[1.8, 4.6, 5.4], size=10.5, header_h=0.45, row_h=0.9)

    # 12 — câu hỏi
    s = add_slide(prs, "Chốt trước khi code", "Câu hỏi cho BE và quyết định cần chốt", 12)
    bullets(s, [
        ("Số tiền: integer VND hay string decimal, có minor unit?", 0),
        ("Kỳ so sánh do BE tính hay FE gọi hai lần rồi trừ?", 0),
        ("marketplaces: repeated param hay CSV, tối đa bao nhiêu sàn?", 0),
        ("Timezone: Asia/Ho_Chi_Minh, “hôm nay” tính thế nào?", 0),
        ("Có endpoint gộp ba khối không, hay bắt buộc tách?", 0),
        ("Response p95 để chọn revalidate 60s hay 300s", 0),
    ], 0.75, 2.0, 6.0, 3.9, size=12.5, space=11)

    slide_table(s, ["Quyết định", "Đề xuất"], [
        ["Bảng block khớp Figma", "Đối chiếu frame export, khoá trước D1"],
        ["Cohort phase 1 hay 2", "Phase 2 nếu C quá tải"],
        ["Ai giữ FE-A", "Người mạnh App Router nhất"],
        ["Freeze contract D8", "Có, chỉ nhận bug fix"],
    ], 7.0, 2.05, 5.55, col_w=[2.0, 3.4], size=10.5, header_h=0.42, row_h=0.62)

    tb = s.shapes.add_textbox(Inches(0.75), Inches(5.35), Inches(6.0), Inches(1.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = "Còn 2 câu hỏi phụ cho PM"
    r.font.size = PPt(11)
    r.font.bold = True
    r.font.color.rgb = PNAVY
    for i, ln in enumerate([
        "Cohort retention cần chạy tối đa bao nhiêu kỳ?",
        "Export CSV cần tối đa bao nhiêu dòng?",
    ]):
        p = tf.add_paragraph()
        p.space_after = PPt(3)
        r = p.add_run()
        r.text = "·  " + ln
        r.font.size = PPt(11)
        r.font.color.rgb = PGRAY

    # 13 — next
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg = s.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = PNAVY
    bg.line.fill.background()

    tb = s.shapes.add_textbox(Inches(0.9), Inches(1.35), Inches(11), Inches(0.5))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "BƯỚC TIẾP THEO"
    r.font.size = PPt(12)
    r.font.bold = True
    r.font.color.rgb = PRGB(0x9D, 0xB4, 0xD8)

    tb = s.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.5), Inches(0.9))
    p = tb.text_frame.paragraphs[0]
    r = p.add_run()
    r.text = "Cần chốt trong buổi họp hôm nay"
    r.font.size = PPt(34)
    r.font.bold = True
    r.font.color.rgb = PRGB(0xFF, 0xFF, 0xFF)

    items = [
        "1. Frame Figma: đối chiếu bảng block, khoá phân rã 3 slice",
        "2. Xác nhận FE-A là critical path và mốc merge D1–D2",
        "3. Chốt 8 câu hỏi kỹ thuật với BE trước khi code",
        "4. Chốt ngưỡng export CSV và số kỳ cohort",
        "5. Tạo repo skeleton + CODEOWNERS ngay sau họp",
    ]
    tb = s.shapes.add_textbox(Inches(0.9), Inches(3.0), Inches(11.4), Inches(3.4))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = PPt(14)
        r = p.add_run()
        r.text = it
        r.font.size = PPt(15)
        r.font.color.rgb = PRGB(0xE6, 0xEC, 0xF6)

    prs.core_properties.title = "Báo cáo tăng trưởng — Kế hoạch triển khai FE"
    prs.core_properties.author = "Tech Lead Frontend"
    prs.save(PPTX_PATH)
    print(f"  -> {PPTX_PATH.name}")


# --------------------------------------------------------------------- main ---
def main() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    DOCS.mkdir(parents=True, exist_ok=True)
    text = MD_PATH.read_text(encoding="utf-8")
    blocks = parse_markdown(text)
    print(f"Parse {len(blocks)} block từ {MD_PATH.name}")

    print("Render mermaid → PNG ...")
    mmds = [b["text"] for b in blocks if b["t"] == "code" and b["lang"] == "mermaid"]

    # slide dùng lại đúng sơ đồ trong tài liệu (không lệch nội dung)
    if mmds:
        path = render_mermaid(mmds[0])
        if path:
            (DIAG / "flow-load.png").write_bytes(path.read_bytes())

    deck_lr = """flowchart LR
  P["page.tsx (slot)"] --> Q["queries.getX()<br/>cache 60s · tag slice"]
  Q --> SRC["source.ts<br/>pickSource(mock, http)"]
  SRC -->|mock| M["fixture.ts"]
  SRC -->|api| H["http.ts + mapper"]
  M --> CMP["KpiCard<br/>ChartFrame<br/>DataTable"]
  H --> CMP
  Q -.->|tải / lỗi / trống| ST["loading · error<br/>empty state"]
"""
    path = render_mermaid(deck_lr)
    if path:
        (DIAG / "flow-data-lr.png").write_bytes(path.read_bytes())

    print("Build DOCX ...")
    build_docx(blocks)
    if os.environ.get("BUILD_PPTX") == "1":
        print("Build PPTX ...")
        build_pptx()
    print("Xong.")


if __name__ == "__main__":
    main()
