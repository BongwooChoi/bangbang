import { normalizePayload, type Restaurant, type RestaurantResponse } from './restaurants';

// Fixed, bounded local searches, not a user-controlled proxy or dataset crawler.
export const SEARCH_STREETS = ['강남대로', '서울 서초구 효령로', '서울 강남구 도곡로', '서울 강남구 역삼로', '서울 서초구 서운로'];
export async function loadRestaurants(): Promise<RestaurantResponse> {
  const base = (process.env.KSKILL_PROXY_BASE_URL || 'https://k-skill-proxy.nomadamas.org').replace(/\/$/, '');
  const results = await Promise.allSettled(SEARCH_STREETS.map(async location => {
    const url = new URL(`${base}/v1/bccard-eatpl/search`);
    url.searchParams.set('location', location);
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000), headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error('upstream_unavailable');
    return normalizePayload(await response.json());
  }));
  const successful = results.filter((r): r is PromiseFulfilledResult<Restaurant[]> => r.status === 'fulfilled');
  if (!successful.length) throw new Error('restaurants_unavailable');
  const unique = new Map<string, Restaurant>();
  successful.forEach(result => result.value.forEach(item => unique.set(item.id, item)));
  return { restaurants: [...unique.values()].sort((a, b) => a.distance - b.distance), fetchedAt: new Date().toISOString(), partial: successful.length < SEARCH_STREETS.length };
}
