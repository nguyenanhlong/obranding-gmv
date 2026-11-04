# FE-C — Orders & Buyers · Phuc (@phuckeo1231)

Phạm vi: `app/(growth)/growth/@orders/**`, `src/features/orders/**`, `src/features/buyers/**`.
Pattern để copy: `src/features/revenue/server/*` (fixture → mock → http → mapper → queries).

## Đã có trên main

- [x] `orders/contracts.ts`: OrderSummary, OrderStatusBucket, `OrderSource`
- [x] `buyers/contracts.ts`: BuyerSummary, CohortRow, TopBuyer, `BuyerSource`
- [x] Slot `@orders` có page / loading / error / default, đang là placeholder

## Việc của nhánh này

### 1. Dựng server layer (copy từ revenue)
- [ ] `orders/server/fixture.ts` — dữ liệu deterministic, cùng cửa sổ ngày với revenue
- [ ] `orders/server/orders.mock.ts` — summary + by-status
- [ ] `orders/server/orders.http.ts` — `reportFetch` + mapper
- [ ] `orders/server/orders.mapper.ts` + test (string→number, null giữ null, tổng 0 không NaN)
- [ ] `orders/server/source.ts` + `queries.ts` (tag `reports:orders`)
- [ ] Lặp lại y hệt cho `buyers/` (tag `reports:buyers`)

### 2. UI
- [ ] KPI: đơn hàng, AOV, cancel rate, return rate
- [ ] Funnel trạng thái: pending → confirmed → shipping → delivered, kèm nhánh cancelled / returned
- [ ] New vs returning (donut) từ `BuyerSummary`
- [ ] Cohort retention table — `null` = kỳ chưa đủ dữ liệu, render khác ô 0%
- [ ] Top buyers: sort theo GMV, limit 10, format `formatCompactMoney`

### 3. Export
- [ ] `/api/reports/orders/export` — CSV funnel trạng thái
- [ ] `/api/reports/buyers/export` — CSV top buyers

### 4. Chất lượng
- [ ] Test cohort: mảng `retention` dài bằng số kỳ thực có
- [ ] Test funnel: tổng các bucket = tổng đơn trong kỳ
- [ ] Screenshot 3 state trong PR

## Không chạm

`layout.tsx`, `src/platform/**`, `src/contracts/**`, `@revenue/**`, `src/features/revenue/**`

## Hỏi PM trước khi làm cohort

Cần chạy tối đa bao nhiêu kỳ? (ảnh hưởng size response và số cột bảng)
