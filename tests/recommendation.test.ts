import test from 'node:test';
import assert from 'node:assert/strict';
import type { Restaurant } from '../src/lib/restaurants';
import { filterRestaurants } from '../src/lib/restaurants';
import { busyDayLabel, busyPeriodLabel, compareRecommended, recommendationBreakdown, recommendationReasons } from '../src/lib/recommendation';

const row: Restaurant = {
  id: 'synthetic', name: '가상 밥집', address: '가상 주소', genre: '한식', category: 'korean',
  lat: 37.49, lng: 127.03, distance: 300, zone: 'bangbang', nationalRank: null, localRank: 20,
  localFavorite: true, groupDining: true, foreignVisitors: false,
  hours: null, busyDay: '월', busyTime: '점심', eatplUrl: 'https://web.paybooc.ai/mer/web/profile/synthetic',
  customerGroups: [],
};
const options = { category: 'all' as const, zone: 'all' as const, query: '', sort: 'recommended', localOnly: false };

test('balanced recommendations can outrank the nearest restaurant without changing distance sort', () => {
  const nearest = { ...row, id: 'nearest', distance: 0, localRank: 95, localFavorite: false };
  assert.equal(filterRestaurants([nearest, row], options)[0].id, row.id);
  assert.equal(filterRestaurants([nearest, row], { ...options, sort: 'distance' })[0].id, nearest.id);
  assert.deepEqual(recommendationBreakdown(row), { distance: 32, localRank: 32, localFavorite: 20, total: 84 });
});
test('unknown ranks earn no points; distances are bounded and ties are deterministic', () => {
  assert.equal(recommendationBreakdown({ ...row, distance: 2000, localRank: null, localFavorite: false }).total, 0);
  assert.equal(recommendationBreakdown({ ...row, distance: NaN, localRank: NaN, localFavorite: false }).total, 0);
  assert.equal(recommendationBreakdown({ ...row, distance: 0, localRank: 0 }).total, 100);
  assert.ok(compareRecommended({ ...row, id: 'a' }, { ...row, id: 'b' }) < 0);
  const unknown = recommendationReasons({ ...row, localRank: null, localFavorite: false });
  assert.deepEqual(unknown, ['사거리에서 직선 300m']);
  assert.ok(recommendationReasons({ ...row, localRank: 0.04 }).includes('지역 매출 상위 0.04%'));
});
test('group filter intersects category, zone and local preference and does not change the input', () => {
  const rows = [row, { ...row, id: 'solo', groupDining: false }, { ...row, id: 'cafe', category: 'cafe' as const }, { ...row, id: 'far', zone: 'gangnam' as const }, { ...row, id: 'visitors', localFavorite: false }];
  const original = rows.map(r => r.id);
  assert.deepEqual(filterRestaurants(rows, { ...options, groupOnly: true, localOnly: true, category: 'korean', zone: 'bangbang', query: '밥집' }).map(r => r.id), ['synthetic']);
  assert.deepEqual(rows.map(r => r.id), original);
  assert.equal(filterRestaurants([rows[1]], { ...options, groupOnly: true }).length, 0);
});
test('congestion labels use provider time windows and preserve unknown values', () => {
  assert.deepEqual(['새벽', '오전', '점심', '오후', '저녁', '심야'].map(busyPeriodLabel), ['새벽 (00–06시)', '오전 (06–11시)', '점심 (11–14시)', '오후 (14–17시)', '저녁 (17–21시)', '심야 (21–24시)']);
  for (const value of [null, '', '실시간', 'toString']) assert.equal(busyPeriodLabel(value), null);
  assert.equal(busyDayLabel('월'), '월요일');
  assert.equal(busyDayLabel('일요일'), '일요일');
  assert.equal(busyDayLabel('알 수 없음'), null);
  assert.equal(busyDayLabel(null), null);
});
