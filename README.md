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

## Cấu trúc thư mục

Mỗi dòng ghi rõ **ai sở hữu** — không ai sửa file của người khác.

```
.
├─ app/                                        ROUTE (Next.js App Router)
│  ├─ (admin)/                                 nhóm route có sidebar
│  │  ├─ layout.tsx                            Chinh   sidebar + breadcrumb + topbar
│  │  ├─ growth/
│  │  │  ├─ page.tsx                           Chinh   M1 — hub báo cáo tăng trưởng
│  │  │  ├─ loading.tsx / error.tsx            Chinh   state của M1
│  │  │  ├─ period/page.tsx                    Long    M2 — chi tiết kỳ
│  │  │  ├─ customers/[customerId]/page.tsx    Phuc    M4 — chi tiết user
│  │  │  └─ sellers/[sellerId]/page.tsx        Phuc    M5 — chi tiết nhà bán
│  │  └─ orders/[orderId]/page.tsx             Long    M6 — chi tiết đơn
│  └─ api/
│     ├─ reports/revalidate/route.ts           Chinh   webhook BE gọi khi có số mới
│     └─ exports/
│        ├─ growth/route.ts                    Chinh   CSV của M1
│        ├─ period/route.ts                    Long    CSV của M2
│        ├─ customer/[customerId]/route.ts     Phuc    CSV của M4
│        └─ seller/[sellerId]/route.ts         Phuc    CSV của M5
│
├─ src/
│  ├─ contracts/base.ts                        Chinh   OrderRow, Period, Delta, Page, Money
│  │                                                   Ring 0 — chỉ thêm, không đổi tên
│  ├─ platform/                                Chinh   hạ tầng dùng chung
│  │  ├─ reports/
│  │  │  ├─ filters.ts                         parseFilters, parsePositiveInt, query string
│  │  │  ├─ source.ts                          pickSource(mock, http) theo DATA_SOURCE
│  │  │  ├─ http.ts                            reportFetch + auth + timeout 8s
│  │  │  ├─ csv.ts                             toCsv + BOM UTF-8 cho Excel
│  │  │  ├─ export.ts                          xlsx/pdf chưa hỗ trợ → 501
│  │  │  └─ tags.ts                            cache tag theo màn
│  │  ├─ mock/
│  │  │  ├─ dataset.ts                         sinh ~4.000 đơn deterministic
│  │  │  └─ aggregate.ts                       totalsOf, deltaOf, newBuyerRate, groupBy
│  │  ├─ ui/                                   KpiCard, ChartFrame, DataTable, OrderTable,
│  │  │                                        ReportFilter, EmptyState, DeltaBadge
│  │  ├─ format/                               money · percent · date
│  │  └─ time.ts                               addDays, bucketOf, bucketRange, previousRange
│  └─ features/                                mỗi slice = 1 màn hình
│     ├─ growth-overview/                      Chinh   M1
│     ├─ period-detail/                        Long    M2
│     ├─ buyer-detail/                         Phuc    M4
│     ├─ seller-detail/                        Phuc    M5
│     └─ order-detail/                         Long    M6
│
└─ docs/                                       plan.md · tasks/ · prompt-reanalysis.md
```

### Một slice gồm những gì

```
src/features/<slice>/
├─ contracts.ts          type view model + interface <X>Source  ← hợp đồng với BE
├─ components/           UI của màn đó, chỉ nhận view model, không fetch
└─ server/
   ├─ <x>.mock.ts        đọc platform/mock/dataset.ts, tính toán — dùng khi DATA_SOURCE=mock
   ├─ <x>.http.ts        implement <X>Source bằng reportFetch — thêm khi BE bàn giao
   ├─ source.ts          pickSource(mock, http)     ← điểm đổi nguồn DUY NHẤT
   └─ queries.ts         unstable_cache + tag       ← page gọi cái này
```

### Luồng một request

```
page.tsx
  └─ getX(filters)          queries.ts   cache 60s, tag theo màn
       └─ <X>Source         source.ts    chọn mock hay http theo DATA_SOURCE
            ├─ <x>.mock.ts  đọc dataset, tính chỉ số
            └─ <x>.http.ts  reportFetch → mapper → view model
  └─ <Component>            components/  render view model, không biết dữ liệu từ đâu
```

### Bảng tra nhanh

| Muốn sửa... | Vào file | Owner |
|---|---|---|
| Filter kỳ, validate ngày | `src/platform/reports/filters.ts` | Chinh |
| Số liệu giả để dev | `src/platform/mock/dataset.ts` | Chinh |
| Công thức một chỉ số | `src/features/<slice>/server/<x>.mock.ts` | owner của màn |
| Nối BE thật | `src/features/<slice>/server/<x>.http.ts` + `source.ts` | owner của màn |
| Cột/nhãn bảng đơn (dùng chung 3 màn) | `src/platform/ui/order-table.tsx` | Chinh |
| Giao diện một màn | `src/features/<slice>/components/**` | owner của màn |
| Thêm type dùng chung | `src/contracts/base.ts` (PR riêng) | Chinh |

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

## Quy ước dữ liệu với BE

| Quy ước | FE làm gì | Ở đâu |
|---|---|---|
| Envelope `{statusCode, message, data}` | Bóc `data`, đọc lỗi 400 từ `message.message`, 404 → `notFound()` | `platform/reports/http.ts` → `gatewayFetch` |
| Số là **chuỗi** (`"1234"`, `"1.234"`, `"1234.00"`) | Parse sang number ở mapper, không `Number()` trần | `platform/reports/parse.ts` |
| Phần trăm BE trả **đã ×100** (`10.9`) | `percentToRatio()` → view model 0..1, chỉ format khi hiển thị | `platform/reports/parse.ts` |
| Query API: `fromDate`, `toDate`, `groupBy` (HOA) | URL vẫn `?from&to&period`; chỉ `toApiQuery()` đổi tên | `platform/reports/filters.ts` |
| Giới hạn kỳ: DAY 93 · WEEK 104 · MONTH 36 · QUARTER 20 · YEAR 10 | `assertGrowthRange()` trước khi gọi API 1 | `platform/reports/filters.ts` |
| API 6: hai đầu cùng một kỳ, `toDate` được ở tương lai | `assertPeriodRange()` | `platform/reports/filters.ts` |
| API 7/8: `toDate ≤ hôm nay`, tối đa 1.096 ngày | `assertEntityRange()` | `platform/reports/filters.ts` |

`growthPercent`/`previousValue` **do BE tính** — FE không tự suy ra.

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
