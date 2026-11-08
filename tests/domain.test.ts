import test from 'node:test';
import assert from 'node:assert/strict';
import proj4 from 'proj4';
import { AREA_POLYGON, CENTER, EXITS, isInArea, distanceMeters } from '../src/lib/geo';
import { TM128, normalizeRestaurant, normalizePayload, safeEatplUrl, estimatedHours, parseSharedIds, sharePath, filterRestaurants } from '../src/lib/restaurants';

const coords = proj4('EPSG:4326', TM128, [CENTER.lng, CENTER.lat]);
// Entirely synthetic restaurant fixture. No provider response is stored in the repository.
const example = { merNm: '테스트 밥집', merAddr: '서울 테스트 주소', merTpbuzNm: '일반한식', merUrl: 'https://web.paybooc.ai/mer/web/profile/synthetic-test', xaxsVal: String(coords[0]), yaxsVal: String(coords[1]), allSaleRnk: 0.04, ccgSaleRnk: 2.5, srtTime: '1800', endTime: '0200', loclPrsnPpltYn: true };

test('corridor includes center and boundary exits but excludes outside restaurants', () => {
  assert.equal(isInArea(CENTER), true);
  Object.values(EXITS).forEach(p => assert.equal(isInArea(p), true));
  assert.equal(isInArea({ lat: 37.505, lng: 127.026 }), false);
  assert.equal(isInArea({ lat: 37.480, lng: 127.035 }), false);
  assert.equal(isInArea({ lat: CENTER.lat, lng: CENTER.lng + 0.01 }), false);
  assert.equal(isInArea({ lat: CENTER.lat, lng: CENTER.lng - 0.01 }), false);
  assert.equal(isInArea({ lat: NaN, lng: 127 }), false);
  assert.equal(AREA_POLYGON.length, 4);
  AREA_POLYGON.forEach(p => assert.equal(isInArea(p), true));
});
test('coordinates roundtrip and straight-line distance do not become walking estimates', () => {
  const result = normalizeRestaurant(example)!;
  assert.ok(distanceMeters(CENTER, result) < 1);
  assert.equal(result.distance, 0);
  assert.equal(result.zone, 'bangbang');
  assert.equal(result.hours, '18:00–익일 02:00');
});
test('provider links stay unchanged and malicious destinations are rejected', () => {
  assert.equal(safeEatplUrl(example.merUrl), example.merUrl);
  for (const url of ['javascript:alert(1)', 'http://web.paybooc.ai/mer/web/profile/a', 'https://web.paybooc.ai.evil.test/mer/web/profile/a', 'https://user@web.paybooc.ai/mer/web/profile/a', 'https://web.paybooc.ai:123/mer/web/profile/a', 'https://evil.test/a', 'https://web.paybooc.ai/redirect']) assert.equal(safeEatplUrl(url), null);
});
test('missing ranks stay unknown and percent decimals survive normalization', () => {
  assert.equal(normalizeRestaurant(example)?.nationalRank, 0.04);
  const result = normalizeRestaurant({ ...example, allSaleRnk: null, ccgSaleRnk: 999 });
  assert.equal(result?.nationalRank, null); assert.equal(result?.localRank, null);
  assert.equal(normalizeRestaurant({ ...example, xaxsVal: 'garbage' }), null);
  assert.equal(normalizeRestaurant({ ...example, merNm: '' }), null);
});
test('time validation and midnight handling', () => {
  assert.equal(estimatedHours('0702', '2246'), '07:02–22:46');
  assert.equal(estimatedHours('2400', '2500'), null);
  assert.equal(estimatedHours('0765', '2000'), null);
  assert.equal(estimatedHours(null, '2000'), null);
});
test('normalizer rejects invalid response and deduplicates merchants', () => {
  assert.throws(() => normalizePayload({ data: [] }));
  assert.equal(normalizePayload({ items: [example, example, {}, null] }).length, 1);
});
test('share links contain validated ids only and cap the selection at five', () => {
  const ids = parseSharedIds('one,two,one,../../../evil,three,four,five,six');
  assert.deepEqual(ids, ['one', 'two', 'three', 'four', 'five']);
  assert.equal(sharePath(ids), '/share?places=one%2Ctwo%2Cthree%2Cfour%2Cfive');
  assert.equal(sharePath([]), '/');
});
test('filters combine search, category, zone and local preference; rank sorts lower first', () => {
  const row = normalizeRestaurant(example)!;
  const second = { ...row, id: 'second', name: '테스트 카페', category: 'cafe' as const, localRank: 0.4, localFavorite: false };
  const options = { category: 'all' as const, zone: 'all' as const, query: '', sort: 'rank', localOnly: false };
  assert.equal(filterRestaurants([row, second], options)[0].id, 'second');
  assert.equal(filterRestaurants([row, second], { ...options, localOnly: true }).length, 1);
  assert.equal(filterRestaurants([row, second], { ...options, category: 'cafe', query: '카페' })[0].id, 'second');
  assert.equal(filterRestaurants([row, second], { ...options, zone: 'gangnam' }).length, 0);
});
