import { csvResponse, toCsv } from '@/platform/reports/csv';
import { parseFilters, searchParamsToRecord } from '@/platform/reports/filters';
import { getRevenueTimeseries } from '@/features/revenue/server/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = parseFilters(searchParamsToRecord(url.searchParams));
  const rows = await getRevenueTimeseries(filters);

  const csv = toCsv(rows, ['bucket', 'gmv', 'orders', 'buyers', 'gmvPrev']);
  return csvResponse(csv, `revenue-${filters.from}_${filters.to}.csv`);
}
