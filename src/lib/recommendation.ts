import type { Restaurant } from './restaurants';

// Product heuristics, not an eat.pl rating or a learned taste prediction.
export const RECOMMENDATION_WEIGHTS = { distance: 40, localRank: 40, localFavorite: 20 } as const;
export const DISTANCE_LIMIT_METERS = 1500;

export function recommendationBreakdown(r: Restaurant) {
  const distance = Number.isFinite(r.distance) && r.distance >= 0
    ? RECOMMENDATION_WEIGHTS.distance * Math.max(0, 1 - r.distance / DISTANCE_LIMIT_METERS) : 0;
  const localRank = r.localRank !== null && Number.isFinite(r.localRank) && r.localRank >= 0 && r.localRank <= 100
    ? RECOMMENDATION_WEIGHTS.localRank * (1 - r.localRank / 100) : 0;
  const localFavorite = r.localFavorite ? RECOMMENDATION_WEIGHTS.localFavorite : 0;
  return { distance, localRank, localFavorite, total: distance + localRank + localFavorite };
}

export function compareRecommended(a: Restaurant, b: Restaurant): number {
  return recommendationBreakdown(b).total - recommendationBreakdown(a).total
    || a.distance - b.distance || a.id.localeCompare(b.id, 'en');
}

export function recommendationReasons(r: Restaurant): string[] {
  const reasons = [`사거리에서 직선 ${r.distance >= 1000 ? `${(r.distance / 1000).toFixed(1)}km` : `${r.distance}m`}`];
  if (r.localRank !== null) reasons.push(`지역 매출 상위 ${r.localRank}%`);
  if (r.localFavorite) reasons.push('동네 단골 많은 곳');
  return reasons;
}

const BUSY_PERIODS: Record<string, string> = {
  새벽: '00–06시', 오전: '06–11시', 점심: '11–14시',
  오후: '14–17시', 저녁: '17–21시', 심야: '21–24시',
};
export function busyPeriodLabel(period: string | null): string | null {
  return period && Object.hasOwn(BUSY_PERIODS, period) ? `${period} (${BUSY_PERIODS[period]})` : null;
}
export function busyDayLabel(day: string | null): string | null {
  return day && /^[월화수목금토일](요일)?$/.test(day) ? `${day[0]}요일` : null;
}
