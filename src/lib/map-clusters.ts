import type { Restaurant } from './restaurants';

export type MapPoint = { restaurant: Restaurant; x: number; y: number };
export type MapCluster = { x: number; y: number; restaurants: Restaurant[] };

// Group nearby positions without relocating single-store pins. Merge neighboring
// groups too, so a cell boundary cannot leave two almost overlapping controls.
export function clusterMapPoints(points: MapPoint[], cellSize: number): MapCluster[] {
  const cells = new Map<string, MapPoint[]>();
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const cell = cells.get(key) ?? [];
    cell.push(point); cells.set(key, cell);
  }
  const groups = [...cells.values()].map(cell => ({
    x: cell.reduce((sum, p) => sum + p.x, 0) / cell.length,
    y: cell.reduce((sum, p) => sum + p.y, 0) / cell.length,
    restaurants: cell.map(p => p.restaurant),
  }));
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i], b = groups[j];
      if (Math.hypot(a.x - b.x, (a.y - b.y) * .75) >= cellSize * .65) continue;
      const count = a.restaurants.length + b.restaurants.length;
      a.x = (a.x * a.restaurants.length + b.x * b.restaurants.length) / count;
      a.y = (a.y * a.restaurants.length + b.y * b.restaurants.length) / count;
      a.restaurants.push(...b.restaurants); groups.splice(j, 1);
      merged = true; break outer;
    }
  }
  return groups;
}
