import 'server-only';

/** Lỗi có thông điệp tiếng Việt từ BE (thường là 400 INVALID_ARGUMENT). */
export class ReportApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
    readonly userMessage: string,
    readonly rawBody: string,
  ) {
    super(`${status} @ ${path}: ${userMessage}`);
    this.name = 'ReportApiError';
  }
}

/** 404: nhà bán / user không tồn tại trên hệ thống (API 7, API 8). */
export class ReportNotFoundError extends Error {
  constructor(readonly path: string) {
    super(`Không tìm thấy dữ liệu: ${path}`);
    this.name = 'ReportNotFoundError';
  }
}

export type Query = Record<string, string | number | boolean | string[] | undefined | null>;

const TIMEOUT_MS = 8_000;

function baseUrl(): string {
  const url = process.env.REPORT_API_BASE_URL;
  if (!url) throw new Error('Thiếu REPORT_API_BASE_URL khi DATA_SOURCE=api');
  return url;
}

/** Lấy câu tiếng Việt trong body lỗi của gateway: { message: { message } } hoặc { message } */
function extractMessage(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) return fallback;
  const outer = body as Record<string, unknown>;
  const inner = outer.message;
  if (typeof inner === 'string' && inner.trim()) return inner;
  if (typeof inner === 'object' && inner !== null) {
    const nested = (inner as Record<string, unknown>).message;
    if (typeof nested === 'string' && nested.trim()) return nested;
  }
  return fallback;
}

/**
 * Điểm vào DUY NHẤT để gọi API báo cáo.
 * - bóc envelope { statusCode, message, data } của gateway
 * - 400 → ReportApiError với userMessage lấy từ message.message
 * - 404 → ReportNotFoundError (page sẽ gọi notFound())
 * - luôn no-store: caching do queries.ts lo, tránh hai tầng cache
 */
export async function gatewayFetch<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  query: Query = {},
): Promise<T> {
  const url = new URL(path, baseUrl());

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, String(value));
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

  if (res.status === 404) throw new ReportNotFoundError(path);

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    throw new ReportApiError(path, res.status, extractMessage(parsed, raw.slice(0, 200)), raw);
  }

  const body = (await res.json()) as { data?: unknown };
  const payload = body && typeof body === 'object' && 'data' in body ? body.data : body;
  return schema.parse(payload);
}

/** @deprecated dùng gatewayFetch. Giữ lại để slice cũ chưa chuyển kịp không vỡ build. */
export async function reportFetch<T>(path: string, query: Query = {}): Promise<T> {
  const url = new URL(path, baseUrl());
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, String(value));
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
  if (!res.ok) throw new ReportApiError(path, res.status, res.statusText, '');
  return (await res.json()) as T;
}
