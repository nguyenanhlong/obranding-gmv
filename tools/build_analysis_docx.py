"""Build bản Word 'Bảo vệ hiểu biết' cho FE-B từ docs/analysis/fe-b-hieu-biet.md.

Chạy: python tools/build_analysis_docx.py
Đặt biến môi trường trước khi import build_docs để bìa và đường dẫn đúng.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

os.environ["DOC_MD"] = "docs/analysis/fe-b-hieu-biet.md"
os.environ["DOC_OUT"] = "docs/analysis/Ban-bao-ve-hieu-biet-FE-B-Long.docx"
os.environ["DOC_KICKER"] = "TÀI LIỆU BẢO VỆ HIỂU BIẾT"
os.environ["DOC_TITLE"] = "M2 & M6 — Bảo vệ hiểu biết"
os.environ["DOC_SUBTITLE"] = "Hiểu flow, logic và kiến trúc · Long (FE-B)"
os.environ["DOC_DESC"] = (
    "Phân tích đề bài Figma: module tương tác, flow diagram các API, hiểu biết và điểm cần chốt.\n"
    "Code trong repo là prototype tự dựng, không phải deliverable."
)
os.environ["DOC_HEADER"] = "M2 & M6 — Bản bảo vệ hiểu biết · FE-B (Long)"
os.environ["DOC_VERSION"] = "1.0"
os.environ["DOC_DATE"] = "08/11/2026"
os.environ["DOC_AUTHOR"] = "Long — FE-B"
os.environ["DOC_TEAM"] = "Long (FE-B) · Người hướng dẫn: A Thành"
os.environ["DOC_STATUS"] = "Bản nháp để review trước buổi họp"
os.environ["DOC_BULLETS"] = (
    "0 bối cảnh · 1 flow · 2 module tương tác · 3 flow diagram API|"
    "4 hiểu biết · 5 prototype · 6 25 câu hỏi why|"
    "7 demo 3 phút · 8 rủi ro · 9 câu mở đầu"
)

sys.path.insert(0, str(ROOT))
import build_docs  # noqa: E402

if __name__ == "__main__":
    build_docs.main()
