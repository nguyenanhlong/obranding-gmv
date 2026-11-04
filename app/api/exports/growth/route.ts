import { csvResponse, toCsv } from '@/platform/reports/csv';
import { rejectUnsupportedFormat } from '@/platform/reports/export';
import { parseFilters, searchParamsToRecord } from '@/platform/reports/filters';
import { getGrowthReport } from '@/features/growth-overview/server/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blocked = rejectUnsupportedFormat(url.searchParams.get('format'));
  if (blocked) return blocked;

  const filters = parseFilters(searchParamsToRecord(url.searchParams));
  const report = await getGrowthReport(filters, 10);

  const rows = report.series.map((p) => ({
    bucket: p.bucket,
    orders: p.orders,
    gmv: p.gmv,
    buyers: p.buyers,
    sellers: p.sellers,
    growthPct: p.growthPct ?? '',
  }));

  const csv = toCsv(rows, ['bucket', 'orders', 'gmv', 'buyers', 'sellers', 'growthPct']);
  return csvResponse(csv, `growth-${filters.from}_${filters.to}.csv`);
}
