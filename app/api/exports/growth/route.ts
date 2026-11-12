import { csvResponse, toCsv } from '@/platform/reports/csv';
import { rejectUnsupportedFormat } from '@/platform/reports/export';
import { growthRangeError, parseFilters, searchParamsToRecord } from '@/platform/reports/filters';
import { getGrowthReport } from '@/features/growth-overview/server/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blocked = rejectUnsupportedFormat(url.searchParams.get('format'));
  if (blocked) return blocked;

  const filters = parseFilters(searchParamsToRecord(url.searchParams));
  const rangeError = growthRangeError(filters);
  if (rangeError) return Response.json({ error: rangeError }, { status: 400 });

  const report = await getGrowthReport(filters);

  const rows = report.periods.map((p) => ({
    period_key: p.key,
    period_label: p.label,
    start_date: p.startDate,
    end_date: p.endDate,
    status: p.status,
    orders: p.orders.value,
    gmv: p.gmv.value,
    buyers: p.buyers.value,
    active_sellers: p.activeSellers.value,
    aov: p.aov,
    growth_percent: p.orders.growthPercent === null ? '' : (p.orders.growthPercent * 100).toFixed(1),
  }));

  const csv = toCsv(rows, [
    'period_key',
    'period_label',
    'start_date',
    'end_date',
    'status',
    'orders',
    'gmv',
    'buyers',
    'active_sellers',
    'aov',
    'growth_percent',
  ]);

  return csvResponse(csv, `growth-${filters.from}_${filters.to}.csv`);
}
