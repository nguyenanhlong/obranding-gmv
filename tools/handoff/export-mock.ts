/**
 * Sinh gói bàn giao MOCK cho CẢ 5 màn (M1, M2, M4, M5, M6) để gửi team BE.
 *
 * Chạy:  npx tsx tools/handoff/export-mock.ts
 * Kết quả: docs/handoff/be-mock-all/
 *
 * Cách làm: copy source ra ngoài, bỏ dòng `import 'server-only'` ở bản copy
 * (package đó chỉ tồn tại trong Next), rồi import chính bản copy ấy để sinh sample.
 * Nhờ vậy sample là output thật của logic đang chạy, không phải viết lại.
 */

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { ReportFilters } from '@/platform/reports/filters';
import type { RawOrderDrawer } from '@/features/order-detail/server/order.schema';
import { DATASET_FROM, DATASET_TO, allOrders } from '@/platform/mock/dataset';
import { buildRawOrderList } from '@/platform/reports/orders/mock';
import { mockListPeriodBuyers } from '@/platform/reports/period-buyers/mock';
import { mockListPeriodSellers } from '@/platform/reports/period-sellers/mock';
import { bucketOf } from '@/platform/time';
import { buildRawGrowthReport } from '@/features/growth-overview/server/growth.raw';
import { buildRawPeriodSummary } from '@/features/period-detail/server/period.raw';
import { buildRawSellerSummary } from '@/features/seller-detail/server/seller.raw';
import { buildRawBuyerSummary } from '@/features/buyer-detail/server/buyer.raw';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'docs', 'handoff', 'be-mock-all');

/** M1: 12 kỳ gần nhất, đúng khung 12 tháng của design */
const FILTERS_GROWTH: ReportFilters = {
  from: '2025-11-01',
  to: '2026-10-27',
  period: 'month',
  tz: 'Asia/Ho_Chi_Minh',
};

/** M2 / M4 / M5 / M6: một kỳ tháng đã chốt */
const FILTERS_PERIOD: ReportFilters = {
  from: '2026-09-01',
  to: '2026-09-30',
  period: 'month',
  tz: 'Asia/Ho_Chi_Minh',
};

const COPY_FILES = [
  'src/contracts/base.ts',
  'src/platform/time.ts',
  'src/platform/reports/filters.ts',
  'src/platform/mock/dataset.ts',
  'src/platform/mock/aggregate.ts',
  'src/platform/reports/series.ts',
  'src/platform/format/phone.ts',
  // API 2 — module đơn dùng chung cho M2/M4/M5
  'src/platform/reports/parse.ts',
  'src/platform/reports/orders/contracts.ts',
  'src/platform/reports/orders/schema.ts',
  'src/platform/reports/orders/mapper.ts',
  'src/platform/reports/orders/mock.ts',
  // API 3/4 — 2 tab của M2
  'src/platform/reports/period-buyers/contracts.ts',
  'src/platform/reports/period-buyers/schema.ts',
  'src/platform/reports/period-buyers/mapper.ts',
  'src/platform/reports/period-buyers/mock.ts',
  'src/platform/reports/period-sellers/contracts.ts',
  'src/platform/reports/period-sellers/schema.ts',
  'src/platform/reports/period-sellers/mapper.ts',
  'src/platform/reports/period-sellers/mock.ts',
  // M1
  'src/features/growth-overview/contracts.ts',
  'src/features/growth-overview/server/growth.mock.ts',
  'src/features/growth-overview/server/growth.mapper.ts',
  'src/features/growth-overview/server/growth.raw.ts',
  'src/features/growth-overview/server/growth.schema.ts',
  // M2
  'src/features/period-detail/contracts.ts',
  'src/features/period-detail/server/period.mock.ts',
  'src/features/period-detail/server/period.raw.ts',
  'src/features/period-detail/server/period.schema.ts',
  'src/features/period-detail/server/period.mapper.ts',
  // M4
  'src/features/buyer-detail/contracts.ts',
  'src/features/buyer-detail/server/buyer.mock.ts',
  'src/features/buyer-detail/server/buyer.schema.ts',
  'src/features/buyer-detail/server/buyer.mapper.ts',
  'src/features/buyer-detail/server/buyer.raw.ts',
  // M5
  'src/features/seller-detail/contracts.ts',
  'src/features/seller-detail/server/seller.mock.ts',
  'src/features/seller-detail/server/seller.schema.ts',
  'src/features/seller-detail/server/seller.mapper.ts',
  'src/features/seller-detail/server/seller.raw.ts',
  // M6
  'src/features/order-detail/contracts.ts',
  'src/features/order-detail/server/order.mock.ts',
  'src/features/order-detail/server/order.schema.ts',
  'src/features/order-detail/server/order.mapper.ts',
];

function writeJson(relPath: string, data: unknown): void {
  const full = join(OUT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log('  json   ', relPath);
}

/** Copy source, bỏ guard server-only, rồi import bản copy để lấy logic thật. */
async function loadMockCopy<T>(rel: string, exportName: string): Promise<T> {
  const full = join(OUT, 'reference', rel);
  const source = readFileSync(full, 'utf8').replace(/^import 'server-only';\r?\n/, '');
  writeFileSync(full, source, 'utf8');

  const mod = (await import(pathToFileURL(full).href)) as Record<string, unknown>;
  const value = mod[exportName];
  if (!value) throw new Error(`Không tìm thấy export ${exportName} trong ${rel}`);
  return value as T;
}

async function main(): Promise<void> {
  rmSync(join(OUT, 'reference'), { recursive: true, force: true });
  rmSync(join(OUT, 'samples'), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const rel of COPY_FILES) {
    const dest = join(OUT, 'reference', rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(ROOT, rel), dest);
    console.log('  copy   ', rel);
  }

  // ── M1: hub báo cáo tăng trưởng — xuất RESPONSE THÔ đúng hợp đồng BE
  // (số dạng chuỗi, % đã ×100). View model của FE đi qua mapper riêng.
  writeJson('samples/m1-growth-report.json', buildRawGrowthReport(FILTERS_GROWTH));

  // ── M2: chi tiết kỳ — summary xuất THÔ đúng hợp đồng API 6, danh sách đơn là mock (API 2)
  const periodSummary = buildRawPeriodSummary(FILTERS_PERIOD);
  writeJson('samples/m2-period-summary.json', periodSummary);

  // API 2 — sample đúng contract: meta + pagination + items
  const periodOrders = buildRawOrderList({
    scope: 'PERIOD',
    groupBy: 'MONTH',
    periodKey: bucketOf(FILTERS_PERIOD.from, 'month'),
    page: 1,
    pageSize: 10,
  });
  writeJson('samples/m2-orders-page.json', periodOrders);

  // API 3/4 — 2 tab còn lại của M2
  writeJson(
    'samples/m2-period-buyers.json',
    mockListPeriodBuyers({
      groupBy: 'MONTH',
      periodKey: bucketOf(FILTERS_PERIOD.from, 'month'),
      sortBy: 'ORDER_COUNT',
      page: 1,
      pageSize: 10,
    }),
  );
  writeJson(
    'samples/m2-period-sellers.json',
    mockListPeriodSellers({
      groupBy: 'MONTH',
      periodKey: bucketOf(FILTERS_PERIOD.from, 'month'),
      page: 1,
      pageSize: 10,
    }),
  );

  // chọn user và seller có nhiều đơn nhất trong kỳ để sample có dữ liệu phong phú
  const inRange = allOrders().filter((o) => {
    const d = o.placedAt.slice(0, 10);
    return d >= FILTERS_PERIOD.from && d <= FILTERS_PERIOD.to;
  });

  const countBy = (pick: (o: (typeof inRange)[number]) => string): string => {
    const map = new Map<string, number>();
    for (const o of inRange) {
      const key = pick(o);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  };

  const sampleCustomerId = countBy((o) => o.customerId) || 'customer-1';
  const sampleSellerId = countBy((o) => o.sellerId) || 'seller-1';

  // M4 — summary xuất THÔ (hợp đồng API 8), danh sách đơn là mock
  const buyerSummary = buildRawBuyerSummary(sampleCustomerId, FILTERS_PERIOD.from, FILTERS_PERIOD.to);
  if (buyerSummary) writeJson('samples/m4-buyer-summary.json', buyerSummary);

  // M5 — summary THÔ (hợp đồng API 7)
  const sellerSummary = buildRawSellerSummary(sampleSellerId, FILTERS_PERIOD.from, FILTERS_PERIOD.to);
  if (sellerSummary) writeJson('samples/m5-seller-summary.json', sellerSummary);

  // danh sách đơn của M4/M5 — mock (chờ API 2)
  const buyerOrders = buildRawOrderList({
    scope: 'CUSTOMER',
    customerId: sampleCustomerId,
    fromDate: FILTERS_PERIOD.from,
    toDate: FILTERS_PERIOD.to,
    page: 1,
    pageSize: 10,
  });
  writeJson('samples/m4-orders-page.json', buyerOrders);

  const sellerOrders = buildRawOrderList({
    scope: 'SELLER',
    sellerId: sampleSellerId,
    fromDate: FILTERS_PERIOD.from,
    toDate: FILTERS_PERIOD.to,
    page: 1,
    pageSize: 10,
  });
  writeJson('samples/m5-orders-page.json', sellerOrders);

  // ── M6: chi tiết đơn
  const firstOrder = periodOrders.items[0];
  if (firstOrder) {
    const fullOrder = allOrders().find((o) => o.publicId === firstOrder.orderPublicId);
    if (fullOrder) {
      // API 5 — response THÔ (tiền dạng chuỗi) đúng hợp đồng growthDrawer
      const buildRawOrderDrawer = await loadMockCopy<(order: typeof fullOrder) => RawOrderDrawer>(
        'src/features/order-detail/server/order.mock.ts',
        'buildRawOrderDrawer',
      );
      writeJson('samples/m6-order-detail.json', buildRawOrderDrawer(fullOrder));
    }
  }

  // ── dữ liệu thô để BE import thử
  const rows = inRange.slice(0, 100);
  const header = [
    'public_id',
    'placed_at',
    'status',
    'seller_code',
    'seller_name',
    'customer_id',
    'customer_name',
    'category',
    'region',
    'item_count',
    'payment',
    'discount_labels',
    'total_vnd',
  ];
  const csv = [
    header.join(','),
    ...rows.map((o) =>
      [
        o.publicId,
        o.placedAt,
        o.status,
        o.sellerCode,
        `"${o.sellerName}"`,
        o.customerId,
        `"${o.customerName}"`,
        `"${o.category}"`,
        `"${o.region}"`,
        o.itemCount,
        o.payment,
        `"${o.discounts.map((d) => d.label).join(' | ')}"`,
        o.total.amount,
      ].join(','),
    ),
  ].join('\r\n');

  mkdirSync(join(OUT, 'samples'), { recursive: true });
  writeFileSync(join(OUT, 'samples', 'orders.100rows.csv'), '\uFEFF' + csv, 'utf8');
  console.log('  csv    samples/orders.100rows.csv');

  // ── tổng quan dataset
  const orders = allOrders();
  const byStatus: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    const month = o.placedAt.slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }

  writeJson('samples/dataset-summary.json', {
    generated_at: new Date().toISOString(),
    total_orders: orders.length,
    total_customers: new Set(orders.map((o) => o.customerId)).size,
    total_sellers: new Set(orders.map((o) => o.sellerId)).size,
    date_range: { from: DATASET_FROM, to: DATASET_TO },
    by_status: byStatus,
    by_month: byMonth,
    notes: [
      'Mỗi đơn là một đơn con theo nhà bán (mô phỏng parent_order_id IS NOT NULL).',
      'placedAt ghi kèm +07:00 nên cắt 10 ký tự đầu ra đúng ngày Việt Nam.',
      'Số tiền là integer VND, đã trừ ưu đãi và cộng phí ship.',
      'Dataset sinh deterministic: cùng seed nên chạy lại ra cùng số.',
      'Sample M4 lấy customer đầu tiên trong kỳ; M5 lấy seller đầu tiên trong kỳ.',
    ],
  });

  console.log('\nXong:', OUT);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
