import type { RestaurantResponse } from './restaurants';

export const directoryStreamType = 'application/x-ndjson';
export const directoryError = '음식점 정보를 잠시 불러오지 못했어요. 잠깐 뒤 다시 시도해 주세요.';
export type DirectoryEvent =
  | { phase: 'base' | 'complete'; batch: RestaurantResponse }
  | { phase: 'error' };

/** A complete batch contains only IDs that were not sent in the base batch. */
export async function readDirectory(response: Response, onBase: (base: RestaurantResponse) => void): Promise<RestaurantResponse> {
  if (!response.ok) throw new Error(directoryError);
  if (!response.headers.get('Content-Type')?.includes(directoryStreamType)) return response.json();
  if (!response.body) throw new Error(directoryError);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let base: RestaurantResponse | undefined;
  let pending = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split('\n');
      pending = done ? '' : lines.pop()!;
      for (const line of lines) {
        if (!line.trim()) continue;
        const event: DirectoryEvent = JSON.parse(line);
        if (event.phase === 'complete') {
          if (!base) return event.batch;
          return { ...event.batch, restaurants: [...base.restaurants, ...event.batch.restaurants].sort((a, b) => a.distance - b.distance) };
        }
        if (event.phase !== 'base' || base) throw new Error(directoryError);
        base = event.batch;
        onBase(base);
      }
      if (done) throw new Error(directoryError);
    }
  } finally {
    reader.releaseLock();
  }
}
