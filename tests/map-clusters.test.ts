import assert from 'node:assert/strict';
import test from 'node:test';
import { clusterMapPoints } from '../src/lib/map-clusters';
import type { Restaurant } from '../src/lib/restaurants';

test('map groups preserve every store and keep single-store geographic positions exact', () => {
  const points = [{restaurant:{id:'a'} as Restaurant,x:15,y:20},{restaurant:{id:'b'} as Restaurant,x:25,y:30},{restaurant:{id:'c'} as Restaurant,x:160,y:190}];
  const original = JSON.stringify(points);
  const grouped = clusterMapPoints(points, 60);
  assert.deepEqual(grouped.map(g => g.restaurants.map(r => r.id)), [['a','b'],['c']]);
  assert.deepEqual(grouped.map(({x,y})=>({x,y})), [{x:20,y:25},{x:160,y:190}]);
  assert.equal(JSON.stringify(points), original);
  assert.equal(clusterMapPoints(points, 10).length, 3);
});
