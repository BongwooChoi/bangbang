import proj4 from 'proj4';
import { CENTER, distanceMeters, isInArea, zoneOf, type Zone } from './geo';
import { compareRecommended } from './recommendation';
import { matchesCustomerGroup, parseCustomerGroups, type CustomerAge, type CustomerGender, type CustomerGroup } from './customers';

export const TM128 = '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +towgs84=-146.43,507.89,681.46,0,0,0,0 +units=m +no_defs';
export const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '🍽️' },
  { id: 'korean', label: '한식', emoji: '🍚' },
  { id: 'noodles', label: '면·분식', emoji: '🍜' },
  { id: 'meat', label: '고기', emoji: '🥩' },
  { id: 'japanese', label: '일식', emoji: '🍣' },
  { id: 'chinese', label: '중식', emoji: '🥟' },
  { id: 'western', label: '양식·기타', emoji: '🍝' },
  { id: 'cafe', label: '카페·간식', emoji: '☕' },
] as const;
export type Category = typeof CATEGORIES[number]['id'];
export type Restaurant = {
  id: string; name: string; address: string; genre: string; category: Category;
  lat: number; lng: number; distance: number; zone: Exclude<Zone, 'all'>;
  nationalRank: number | null; localRank: number | null;
  localFavorite: boolean; groupDining: boolean; foreignVisitors: boolean;
  hours: string | null; busyDay: string | null; busyTime: string | null;
  customerGroups: CustomerGroup[];
  eatplUrl: string;
};
export type RestaurantResponse = { restaurants: Restaurant[]; fetchedAt: string; partial: boolean; error?: string };

export function classify(genre: string): Category {
  if (/카페|커피|빵|베이커리|샌드위치|아이스크림|빙수|떡\/한과|도넛/.test(genre)) return 'cafe';
  if (/고기|갈비|곱창|족발|보쌈|양꼬치|치킨/.test(genre)) return 'meat';
  if (/중식|중국|마라/.test(genre)) return 'chinese';
  if (/일식|스시|초밥|돈가스|라멘/.test(genre)) return 'japanese';
  if (/국수|면|만두|분식|떡볶이|김밥|스넥/.test(genre)) return 'noodles';
  if (/한식|찜|탕|찌개|도시락|죽|해산물|전\/|한정식/.test(genre)) return 'korean';
  return 'western';
}
export const categoryInfo = (id: Category) => CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0];
export function safeEatplUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'web.paybooc.ai' || u.port || u.username || u.password) return null;
    if (!/^\/mer\/web\/profile\/[A-Za-z0-9_-]{1,100}$/.test(u.pathname)) return null;
    return value; // Preserve the returned link exactly. Never append tracking parameters.
  } catch { return null; }
}
const text = (v: unknown, max = 200): string => typeof v === 'string' ? v.trim().slice(0, max) : '';
const rank = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
export function estimatedHours(start: unknown, end: unknown): string | null {
  const valid = (s: unknown): s is string => typeof s === 'string' && /^(?:[01]\d|2[0-3])[0-5]\d$/.test(s);
  if (!valid(start) || !valid(end)) return null;
  const display = (s: string) => `${s.slice(0, 2)}:${s.slice(2)}`;
  return `${display(start)}–${end < start ? '익일 ' : ''}${display(end)}`;
}
export function normalizeRestaurant(value: unknown): Restaurant | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const name = text(row.merNm, 100), address = text(row.merAddr), eatplUrl = safeEatplUrl(row.merUrl);
  if (!name || !address || !eatplUrl || !row.xaxsVal || !row.yaxsVal) return null;
  const x = Number(row.xaxsVal), y = Number(row.yaxsVal);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  let lng: number, lat: number;
  try { [lng, lat] = proj4(TM128, 'EPSG:4326', [x, y]); } catch { return null; }
  if (!isInArea({ lat, lng })) return null;
  const genre = text(row.merTpbuzNm, 50) || '업종 미확인';
  return {
    id: new URL(eatplUrl).pathname.split('/').pop()!, name, address, genre,
    category: classify(genre), lat, lng, distance: Math.round(distanceMeters(CENTER, { lat, lng })),
    zone: zoneOf({ lat, lng }), nationalRank: rank(row.allSaleRnk), localRank: rank(row.ccgSaleRnk),
    localFavorite: row.loclPrsnPpltYn === true, groupDining: row.empyVsitYn === true,
    foreignVisitors: row.frnrVsitYn === true, hours: estimatedHours(row.srtTime, row.endTime),
    busyDay: text(row.congestionDwk, 10) || null, busyTime: text(row.congestionTizn, 10) || null, eatplUrl,
    customerGroups: parseCustomerGroups(row.vistCstmrRnkList),
  };
}
export function normalizePayload(payload: unknown): Restaurant[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { items?: unknown }).items)) throw new Error('invalid_upstream');
  const unique = new Map<string, Restaurant>();
  for (const raw of (payload as { items: unknown[] }).items.slice(0, 100)) {
    const item = normalizeRestaurant(raw);
    if (item) unique.set(item.id, item);
  }
  return [...unique.values()];
}
export function filterRestaurants(rows: Restaurant[], options: { category: Category; zone: Zone; query: string; sort: string; localOnly: boolean; groupOnly?: boolean; customerAge?: CustomerAge; customerGender?: CustomerGender }): Restaurant[] {
  const q = options.query.trim().toLocaleLowerCase('ko');
  return rows.filter(r => (options.category === 'all' || r.category === options.category)
    && (options.zone === 'all' || r.zone === options.zone)
    && (!options.localOnly || r.localFavorite)
    && (!options.groupOnly || r.groupDining)
    && matchesCustomerGroup(r.customerGroups, options.customerAge, options.customerGender)
    && (!q || `${r.name} ${r.address} ${r.genre}`.toLocaleLowerCase('ko').includes(q)))
    .sort((a, b) => options.sort === 'recommended' ? compareRecommended(a, b) : options.sort === 'rank'
      ? (a.localRank ?? 101) - (b.localRank ?? 101) || a.distance - b.distance
      : a.distance - b.distance || (a.localRank ?? 101) - (b.localRank ?? 101));
}
export function parseSharedIds(value: string | null): string[] {
  return [...new Set((value ?? '').split(',').filter(id => /^[A-Za-z0-9_-]{1,100}$/.test(id)))].slice(0, 5);
}
export function sharePath(ids: string[]): string {
  const clean = parseSharedIds(ids.join(','));
  return clean.length ? `/share?places=${encodeURIComponent(clean.join(','))}` : '/';
}
