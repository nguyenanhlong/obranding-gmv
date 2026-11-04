import { FilterBar } from './_components/filter-bar';
import { parseFilters } from '@/platform/reports/filters';

/**
 * Slot `children` của /growth — chỉ chứa bộ lọc.
 * searchParams là Promise trong Next 15 nên phải await.
 */
export default async function GrowthPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await props.searchParams);

  return <FilterBar filters={filters} />;
}
