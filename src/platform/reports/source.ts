import 'server-only';

export type DataMode = 'mock' | 'api';

export function dataMode(): DataMode {
  return process.env.DATA_SOURCE === 'api' ? 'api' : 'mock';
}

export function isMockMode(): boolean {
  return dataMode() === 'mock';
}

/**
 * Điểm chuyển nguồn DUY NHẤT (per-slice).
 * Mỗi feature tự gọi pickSource(mock, http) trong server/source.ts của mình,
 * nên platform không phải import features và không ai sửa file chung khi BE bàn giao.
 */
export function pickSource<M extends object, A extends object>(mock: M, api: A): M | A {
  return dataMode() === 'api' ? api : mock;
}
