# FE-B — Revenue & Growth · Long (@nguyenanhlong)

Phạm vi: `app/(growth)/growth/@revenue/**`, `src/features/revenue/**`.
Reference implementation đã có sẵn để copy pattern: `fixture → mock → http → mapper → queries → component`.

## Đã có trên main

- [x] `contracts.ts`: RevenueSummary, TimeseriesPoint, MarketplaceRevenue, `RevenueSource`
- [x] Fixture deterministic 365 ngày + mock tính summary / timeseries / by-marketplace
- [x] `revenue.http.ts` implement `RevenueSource` bằng `reportFetch`
- [x] `queries.ts` bọc `unstable_cache` với tag `reports:revenue`
- [x] KPI row (GMV, đơn, GMV/ngày, tăng trưởng) render từ mock
- [x] `/api/reports/revenue/export` trả CSV UTF-8 có BOM

## Việc của nhánh này

### 1. Growth chart
- [ ] `components/growth-chart.tsx` — `'use client'`, Recharts
- [ ] 3 series: GMV (trục trái), đơn hàng, người mua (trục phải) — chốt với Figma
- [ ] Đường kỳ so sánh (nét đứt) từ `gmvPrev`
- [ ] Tooltip format `formatCompactMoney` + `formatCount`
- [ ] State rỗng: `EmptyState` khi `timeseries.length === 0`

### 2. Doanh thu theo sàn
- [ ] `components/marketplace-breakdown.tsx` — bar ngang + bảng share
- [ ] `getRevenueByMarketplace` (đã có trong `queries.ts`)
- [ ] Sort theo GMV giảm dần, giữ top N + "khác"

### 3. Chốt với BE trước khi đổi contract
- [ ] Số tiền: integer VND hay string? (`toInt` đã chịu được cả hai)
- [ ] `gmv_prev` BE tính hay FE gọi 2 lần?
- [ ] `marketplaces` repeated param hay CSV?

### 4. Chất lượng
- [ ] Test aggregate: week/month bucket đúng biên (thứ 2, đầu tháng)
- [ ] Test `growthRate` khi kỳ trước = 0 → `null`
- [ ] Screenshot 3 state trong PR

## Không chạm

`layout.tsx`, `src/platform/**`, `src/contracts/**`, `@orders/**`
