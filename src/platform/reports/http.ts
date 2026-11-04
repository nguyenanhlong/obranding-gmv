import 'server-only';

export class ReportApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(`Report API ${status} @ ${path}`);
    this.name = 'ReportApiError';
  }
}

export type Query = Record<string, string | number | boolean | string[] | undefined | null>;

const TIMEOUT_MS = 8_000;

function baseUrl(): string {
  const url = process.env.REPORT_API_BASE_URL;
  if (!url) throw new Error('Thiếu REPORT_API_BASE_URL khi DATA_SOURCE=api');
  return url;
}

/**
 * Wrapper fetch dùng chung cho mọi *.http.ts.
 * Caching do unstable_cache ở queries.ts lo → ở đây luôn no-store để tránh 2 tầng.
 */
export async function reportFetch<T>(path: string, query: Query = {}): Promise<T> {
  const url = new URL(path, baseUrl());

  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${process.env.REPORT_API_TOKEN ?? ''}`,
      'x-request-id': crypto.randomUUID(),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ReportApiError(path, res.status, body);
  }

  return (await res.json()) as T;
}
