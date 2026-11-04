# Báo cáo tăng trưởng — Obranding GMV

Màn hình báo cáo **GMV · đơn hàng · user mua hàng** cho 3 FE, chia theo **màn hình** (vertical slice), mỗi file một owner.

- **Stack**: Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · zod · Recharts
- **Dữ liệu**: Server Component → `queries.ts` → `source.ts` (mock | api) → mapper → UI
- **Design**: 6 artboard — xem [`docs/plan.md`](docs/plan.md) · [bản Word](docs/BaoCao-TangTruong-KeHoach-FE.docx)
- ⚠️ Bản kế hoạch cũ (chia theo "doanh thu sàn / đơn / user") đã bị thay thế. Xem [`docs/prompt-reanalysis.md`](docs/prompt-reanalysis.md) để biết cách đọc lại design.

## Chạy local

```bash
npm ci
copy .env.example .env.local   # macOS/Linux: cp .env.example .env.local
npm run dev                    # http://localhost:3000/growth
```

`npm run verify` = typecheck + lint + test + build (giống CI).

## Màn hình & route

| Màn | Route | Owner | Feature folder |
|---|---|---|---|
| M1 Báo cáo tăng trưởng (hub) | `/growth` | Chinh | `src/features/growth-overview` |
| M2 Chi tiết kỳ | `/growth/period` | Long | `src/features/period-detail` |
| M4 Chi tiết user | `/growth/customers/[customerId]` | Phuc | `src/features/buyer-detail` |
| M5 Chi tiết nhà bán | `/growth/sellers/[sellerId]` | Phuc | `src/features/seller-detail` |
| M6 Chi tiết đơn | `/orders/[orderId]` | Long | `src/features/order-detail` |

## Cấu trúc

```
app/(admin)/
├─ layout.tsx                    Chinh  sidebar + breadcrumb
├─ growth/page.tsx               Chinh  M1
├─ growth/period/page.tsx        Long   M2
├─ growth/customers/[id]/page.tsx Phuc  M4
├─ growth/sellers/[id]/page.tsx   Phuc  M5
└─ orders/[orderId]/page.tsx      Long  M6

src/
├─ contracts/base.ts             OrderRow, Period, Delta, Money — Chinh sở hữu
├─ platform/                     filter, UI kit, format, mock dataset, export — Chinh
└─ features/<slice>/             contracts + server/ + components — owner của slice
```

## Ba nhánh

| Nhánh | Người | Màn hình |
|---|---|---|
| `feat/fe-a-chinh` | Chinh — [@shenny1255-cmyk](https://github.com/shenny1255-cmyk) | M1 + platform |
| `feat/fe-b-long` | Long — [@nguyenanhlong](https://github.com/nguyenanhlong) | M2 + M6 |
| `feat/fe-c-phuc` | Phuc — [@phuckeo1231](https://github.com/phuckeo1231) | M4 + M5 |

Checklist theo người: [`docs/tasks/chinh.md`](docs/tasks/chinh.md) · [`docs/tasks/long.md`](docs/tasks/long.md) · [`docs/tasks/phuc.md`](docs/tasks/phuc.md)

## Đổi nguồn dữ liệu

```bash
DATA_SOURCE=mock     # mặc định — dataset deterministic dùng chung cho cả 5 màn
DATA_SOURCE=api      # khi BE bàn giao
REPORT_API_BASE_URL=https://api...
REPORT_API_TOKEN=...
```

Khi BE xong: viết `<slice>/server/<x>.http.ts` implement `<X>Source`, đổi `pickSource(mock, http)` trong `source.ts`, đổi env. Page/component không đổi.

Endpoint dự kiến lấy từ đặc tả trong design (M3): `/admin/order-reports/growth`, `/growth/period`, `/growth/customers/:id`, `/growth/sellers/:id`, `/admin/orders/:publicId`.

## CI/CD

| Workflow | Trigger | Việc làm |
|---|---|---|
| `ci.yml` | mọi PR + push `main` | `npm ci` → typecheck → lint boundaries → vitest → build |
| `deploy.yml` | sau khi CI trên `main` xanh | deploy Vercel production (skip nếu chưa có secret) |

Bật deploy: thêm `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` trong Settings → Secrets → Actions.

## Quy tắc vàng

1. Một file — một owner (`.github/CODEOWNERS`).
2. Không sửa `src/contracts/**` trong PR feature — PR riêng, 2 người review.
3. Không import chéo `features/*` (lint chặn).
4. Không import `platform/mock/*` ngoài `server/` của slice mình.
5. PR ≤ 400 dòng, rebase `main` trước khi mở PR.

Chi tiết: [`CONTRIBUTING.md`](CONTRIBUTING.md).
