import { normalizePayload, type Restaurant, type RestaurantResponse } from './restaurants';

// Fixed, bounded local searches, not a user-controlled proxy or dataset crawler.
export const SEARCH_STREETS = [
  '강남대로', '서울 서초구 효령로', '서울 강남구 도곡로', '서울 강남구 역삼로', '서울 서초구 서운로',
  '서울 강남구 테헤란로', '서울 서초구 서초대로', '서울 서초구 남부순환로', '서울 강남구 남부순환로', '서울 서초구 바우뫼로',
];
// All nine provider standard categories, plus the AI cafe category used by our UI.
// Standard and AI categories are independent systems, not parent/child groups.
export const SUPPLEMENTAL_GENRES = ['중국음식', '카페', '일반한식', '서양음식', '스넥', '일식회집', '주점', '칵테일바', '갈비전문점', '한정식'] as const;
export const MAX_CONCURRENT_SEARCHES = 5;

async function settleWithLimit<T>(jobs: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(jobs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_SEARCHES, jobs.length) }, async () => {
    while (next < jobs.length) {
      const index = next++;
      try { results[index] = { status: 'fulfilled', value: await jobs[index]() }; }
      catch (reason) { results[index] = { status: 'rejected', reason }; }
    }
  }));
  return results;
}
type RoadResult = { restaurants: Restaurant[]; atLimit: boolean };

function snapshot(results: PromiseSettledResult<RoadResult>[]): RestaurantResponse {
  const unique = new Map<string, Restaurant>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const item of result.value.restaurants) if (!unique.has(item.id)) unique.set(item.id, item);
    }
  }
  return { restaurants: [...unique.values()].sort((a, b) => a.distance - b.distance), fetchedAt: new Date().toISOString(), partial: results.some(r => r.status === 'rejected') };
}

export async function loadRestaurants(filters: { merNm?: string; merTpbuzNm?: string | null } = {},
  options: { signal?: AbortSignal; onBase?: (data: RestaurantResponse) => void } = {}): Promise<RestaurantResponse> {
  const base = (process.env.KSKILL_PROXY_BASE_URL || 'https://k-skill-proxy.nomadamas.org').replace(/\/$/, '');
  // Base and supplemental phases share a deadline within the route's 30s budget.
  const timeout = AbortSignal.timeout(24_000);
  const deadline = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let rateLimited = false;
  async function search(location: string, genre?: string, merchant = filters.merNm) {
    deadline.throwIfAborted();
    if (rateLimited) throw new Error('upstream_rate_limited');
    const url = new URL(`${base}/v1/bccard-eatpl/search`);
    url.searchParams.set('location', location);
    if (merchant) url.searchParams.set('merNm', merchant);
    if (genre) url.searchParams.set('merTpbuzNm', genre);
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.any([deadline, AbortSignal.timeout(12_000)]), headers: { 'Accept': 'application/json' } });
    // Do not retry or continue queued requests after a provider throttle response.
    if (response.status === 429) rateLimited = true;
    if (!response.ok) throw new Error('upstream_unavailable');
    const payload: unknown = await response.json();
    const restaurants = normalizePayload(payload);
    return { restaurants, atLimit: (payload as { items: unknown[] }).items.length >= 100 };
  }
  const results = await settleWithLimit(SEARCH_STREETS.map(location => () => search(location, filters.merTpbuzNm ?? undefined)));
  const successful = results.filter(r => r.status === 'fulfilled');
  if (!successful.length) throw new Error('restaurants_unavailable');
  const compactName = filters.merNm?.replace(/\s+/g, '');
  // A provider literal search can miss a registered name written without spaces.
  const retryCompactName = compactName && compactName !== filters.merNm && successful.length === results.length
    && successful.every(result => !result.value.restaurants.length);
  const nameMatches = retryCompactName
    ? await settleWithLimit(SEARCH_STREETS.map(location => () => search(location, filters.merTpbuzNm ?? undefined, compactName)))
    : [];
  // A full response can omit lower-ranked categories before our boundary filter.
  // Only saturated roads need category searches; keep the same geography.
  const cappedStreets = filters.merTpbuzNm ? [] : SEARCH_STREETS.filter((_, i) => results[i].status === 'fulfilled' && results[i].value.atLimit);
  if (options.onBase && cappedStreets.length && !deadline.aborted && !rateLimited) {
    const baseData = snapshot([...results, ...nameMatches]);
    if (baseData.restaurants.length) options.onBase(baseData);
  }
  const supplements = await settleWithLimit(SUPPLEMENTAL_GENRES.flatMap(genre =>
    cappedStreets.map(location => () => search(location, genre))));
  return snapshot([...results, ...nameMatches, ...supplements]);
}
