import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesCustomerGroup, parseCustomerGroups } from '../src/lib/customers';
import { filterRestaurants, type Restaurant } from '../src/lib/restaurants';

test('only the three ranked groups are parsed and unrecognized groups remain unknown', () => {
  assert.deepEqual(parseCustomerGroups({ rk01: '30대여성', rk02: '60대 이상 남성', rk03: '10대남성', rk04: '20대여성' }), [
    { age: '30', gender: 'female', label: '30대 여성', rank: 1 },
    { age: '60+', gender: 'male', label: '60대 이상 남성', rank: 2 },
    { age: '10', gender: 'male', label: '10대 남성', rank: 3 },
  ]);
  for (const value of [null, [], '30대여성', { rk01: 'unknown', rk02: 123, rk03: '70대여성' }]) assert.deepEqual(parseCustomerGroups(value), []);
  assert.deepEqual(parseCustomerGroups({ rk02: '20대여성', rk03: '20대여성' }).map(g => g.rank), [2]);
});

test('age and gender must match one group, not two different entries', () => {
  const groups = parseCustomerGroups({ rk01: '20대남성', rk02: '30대여성' });
  assert.equal(matchesCustomerGroup(groups, '20', 'female'), false);
  assert.equal(matchesCustomerGroup(groups, '30', 'female'), true);
  assert.equal(matchesCustomerGroup(groups, '20', 'all'), true);
  assert.equal(matchesCustomerGroup(groups, 'all', 'female'), true);
  assert.equal(matchesCustomerGroup([], 'all', 'all'), true);
  assert.equal(matchesCustomerGroup(undefined, '30', 'all'), false);
});

test('customer combination composes with meal filters, ranking and missing data', () => {
  const row: Restaurant = { id: 'test', name: '가상 가게', address: '테스트', genre: '한식', category: 'korean', lat: 37.49, lng: 127.03, distance: 100, zone: 'bangbang', nationalRank: null, localRank: 1, localFavorite: true, groupDining: true, foreignVisitors: false, hours: null, busyDay: null, busyTime: null, eatplUrl: 'https://web.paybooc.ai/mer/web/profile/test', customerGroups: parseCustomerGroups({ rk01: '30대여성' }) };
  const others = [{ ...row, id: 'solo', groupDining: false }, { ...row, id: 'unknown', customerGroups: [] }, { ...row, id: 'different', customerGroups: parseCustomerGroups({ rk01: '30대남성', rk02: '20대여성' }) }];
  const options = { category: 'korean' as const, zone: 'bangbang' as const, query: '가상', sort: 'recommended', localOnly: true, groupOnly: true, customerAge: '30' as const, customerGender: 'female' as const };
  assert.deepEqual(filterRestaurants([row, ...others], options).map(r => r.id), ['test']);
  assert.equal(filterRestaurants([row, ...others], { ...options, groupOnly: false, customerAge: 'all', customerGender: 'all' }).length, 4);
});
