export type Point = { lat: number; lng: number };

// Kakao Local lookup, 2026-11-08. Sources and geometry: docs/data-and-boundary.md.
export const CENTER: Point = { lat: 37.4895465688273, lng: 127.03166068044 };
export const EXITS = {
  gangnam1: { lat: 37.498076243713754, lng: 127.02875795264038 },
  gangnam8: { lat: 37.497536025092366, lng: 127.02712930848803 },
  yangjae1: { lat: 37.4847311220783, lng: 127.033332033917 },
  yangjae4: { lat: 37.484847905652394, lng: 127.03454190027368 },
} satisfies Record<string, Point>;
const SCALE_X = 111_320 * Math.cos(CENTER.lat * Math.PI / 180);
const SCALE_Y = 111_320;
type XY = { x: number; y: number };
const xy = (p: Point): XY => ({ x: (p.lng - CENTER.lng) * SCALE_X, y: (p.lat - CENTER.lat) * SCALE_Y });
const point = (p: XY): Point => ({ lng: p.x / SCALE_X + CENTER.lng, lat: p.y / SCALE_Y + CENTER.lat });
const mid = (a: Point, b: Point): Point => ({ lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 });
const north = xy(mid(EXITS.gangnam8, EXITS.gangnam1));
const south = xy(mid(EXITS.yangjae1, EXITS.yangjae4));
const length = Math.hypot(north.x - south.x, north.y - south.y);
const normal = { x: (north.y - south.y) / length, y: -(north.x - south.x) / length };
export const HALF_WIDTH_METERS = 400;
const cross = (a: XY, b: XY, p: XY) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
const northSide = (p: XY) => -cross(xy(EXITS.gangnam8), xy(EXITS.gangnam1), p);
const southSide = (p: XY) => cross(xy(EXITS.yangjae1), xy(EXITS.yangjae4), p);
const lateral = (p: XY) => (p.x - south.x) * normal.x + (p.y - south.y) * normal.y;
const constraints = [northSide, southSide, (p: XY) => HALF_WIDTH_METERS - lateral(p), (p: XY) => HALF_WIDTH_METERS + lateral(p)];

export function isInArea(p: Point): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && constraints.every(fn => fn(xy(p)) >= -0.001);
}
// Clip a generous rectangle by the two exit lines and the two corridor sides.
let vertices: XY[] = [{ x: -3000, y: -3000 }, { x: 3000, y: -3000 }, { x: 3000, y: 3000 }, { x: -3000, y: 3000 }];
for (const fn of constraints) {
  const next: XY[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const fa = fn(a), fb = fn(b);
    if (fa >= 0) next.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb);
      next.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
    }
  }
  vertices = next;
}
export const AREA_POLYGON = vertices.map(point);
export function distanceMeters(a: Point, b: Point): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export type Zone = 'all' | 'bangbang' | 'gangnam' | 'yangjae';
export function zoneOf(p: Point): Exclude<Zone, 'all'> {
  if (p.lat > CENTER.lat + 0.003) return 'gangnam';
  if (p.lat < CENTER.lat - 0.0023) return 'yangjae';
  return 'bangbang';
}
