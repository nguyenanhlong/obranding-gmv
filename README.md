# Báo cáo tăng trưởng — Obranding GMV

Màn hình báo cáo **GMV sàn · đơn hàng · user mua hàng** cho 3 FE làm song song, mỗi người sở hữu một slice riêng.

- **Stack**: Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · zod · Recharts
- **Kiến trúc**: Parallel Routes (`@revenue`, `@orders`) làm ranh giới sở hữu
- **Dữ liệu**: Server Component → `server/queries.ts` → `source.ts` (mock | api) → mapper → UI
- **Tài liệu thiết kế**: [`docs/plan.md`](docs/plan.md), [bản Word](docs/BaoCao-TangTruong-KeHoach-FE.docx), [deck review](docs/BaoCao-TangTruong-KeHoach-FE-Review.pptx)

## Chạy local

```bash
npm ci
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000/growth
```

Kiểm tra toàn bộ như CI:

```bash
npm run verify   # typecheck + lint + test + build
```

## Cấu trúc

```
app/
├─ (growth)/growth/
│  ├─ layout.tsx            FE-A  shell, grid, badge nguồn dữ liệu
│  ├─ page.tsx              FE-A  slot children → FilterBar
│  ├─ _components/          FE-A  filter-bar
│  ├─ @revenue/             FE-B  page · loading · error · default
│  └─ @orders/              FE-C  page · loading · error · default
└─ api/reports/
   ├─ revalidate/           FE-A  webhook cho BE
   └─ revenue/export/       FE-B  CSV

src/
├─ contracts/base.ts        Ring 0 — chỉ thêm, không đổi
├─ platform/               FE-A: filters, source, tags, http, csv, ui kit, format
└─ features/
   ├─ revenue/             FE-B: contracts, server/*, components
   ├─ orders/              FE-C: contracts → tự dựng server/components
   └─ buyers/              FE-C: contracts → tự dựng server/components
```

## Ba nhánh làm việc

| Nhánh | Owner | Phạm vi | Việc đầu tiên |
|---|---|---|---|
| `feat/fe-a-chinh` | **Chinh** — [@shenny1255-cmyk](https://github.com/shenny1255-cmyk) | `layout.tsx`, `_components/**`, `src/platform/**`, `src/contracts/**` | FilterBar điều hướng tức thì, UI kit, revalidate |
| `feat/fe-b-long` | **Long** — [@nguyenanhlong](https://github.com/nguyenanhlong) | `@revenue/**`, `src/features/revenue/**` | Growth chart + bảng theo sàn |
| `feat/fe-c-phuc` | **Phuc** — [@phuckeo1231](https://github.com/phuckeo1231) | `@orders/**`, `src/features/orders/**`, `src/features/buyers/**` | KPI đơn, funnel, buyer, cohort |

Muốn đổi người phụ trách: sửa đúng các dòng trong `.github/CODEOWNERS` bằng một PR riêng.

Checklist theo người: [`src/platform/TASKS.md`](src/platform/TASKS.md) · [`src/features/revenue/TASKS.md`](src/features/revenue/TASKS.md) · [`src/features/orders/TASKS.md`](src/features/orders/TASKS.md)

Mỗi nhánh có file `TASKS.md` trong đúng scope của mình — tick dần khi làm.

## Đổi nguồn dữ liệu

```bash
# .env.local
DATA_SOURCE=mock                    # mặc định, dùng fixture deterministic
DATA_SOURCE=api                     # nối BE thật
REPORT_API_BASE_URL=https://api...
REPORT_API_TOKEN=...
```

Khi BE bàn giao, chỉ cần:

1. Viết `src/features/<slice>/server/<x>.http.ts` implement interface `<X>Source`.
2. Viết `<x>.mapper.ts` map response thô → view model.
3. Đổi `DATA_SOURCE=api`.

Page, component và hook không đổi một dòng. Các endpoint dự kiến xem ở `docs/plan.md` mục 3.1.

## CI/CD

| Workflow | Trigger | Việc làm |
|---|---|---|
| `ci.yml` | mọi PR + push `main` | `npm ci` → typecheck → lint (boundaries) → unit test → build |
| `deploy.yml` | push `main` + thủ công | deploy Vercel production (bỏ qua nếu chưa có secret) |

Bật deploy: thêm 3 secret `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` trong Settings → Secrets → Actions. Chưa có thì workflow tự skip, không fail.

Bật bảo vệ nhánh (chạy một lần, cần `gh` đã đăng nhập):

```bash
gh api -X PUT repos/nguyenanhlong/obranding-gmv/branches/main/protection \
  -f required_status_checks.strict=true \
  -f 'required_status_checks.contexts[]=verify' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f restrictions=
```

## Quy tắc vàng

1. Một file — một owner. Xem `.github/CODEOWNERS`.
2. Không sửa `src/contracts/**` trong PR feature. Cần đổi → PR riêng, 2 người review.
3. Không tự đọc `searchParams`: luôn dùng `parseFilters()`.
4. Không import fixture/mock ngoài `server/source.ts`.
5. PR ≤ 400 dòng diff, tiêu đề theo conventional commits.

Chi tiết quy trình: [`CONTRIBUTING.md`](CONTRIBUTING.md).
