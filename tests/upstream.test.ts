import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRestaurants, SEARCH_STREETS, SUPPLEMENTAL_GENRES, MAX_CONCURRENT_SEARCHES } from '../src/lib/eatpl';
import proj4 from 'proj4';
import { CENTER, isInArea } from '../src/lib/geo';
import { TM128 } from '../src/lib/restaurants';

const [x, y] = proj4('EPSG:4326', TM128, [CENTER.lng, CENTER.lat]);
const fixture = (id: string, genre = '카페') => ({ merNm: `가상 ${id}`, merAddr: '테스트 주소', merTpbuzNm: genre, merUrl: `https://web.paybooc.ai/mer/web/profile/${id}`, xaxsVal: String(x), yaxsVal: String(y) });

test('partial upstream failures preserve valid responses and report partial status', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url: URL, options: RequestInit) => {
    calls++;
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal);
    if (calls === 1) return new Response('unavailable', { status: 503 });
    return Response.json({ items: [] });
  });
  const result = await loadRestaurants();
  assert.equal(calls, SEARCH_STREETS.length);
  assert.equal(result.partial, true);
  assert.deepEqual(result.restaurants, []);
});
test('all upstream failures return an error instead of fake or stale restaurant data', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'unavailable' }, { status: 503 }));
  await assert.rejects(loadRestaurants(), /restaurants_unavailable/);
});

test('only capped roads receive bounded category searches; new restaurants merge without duplicates or out-of-area rows', async t => {
  const calls: URL[] = [];
  const original = fixture('base');
  const [outsideX, outsideY] = proj4('EPSG:4326', TM128, [127.03, 37.51]);
  t.mock.method(globalThis, 'fetch', async (url: URL, options: RequestInit) => {
    calls.push(url);
    assert.equal(options.cache, 'no-store');
    const genre = url.searchParams.get('merTpbuzNm');
    if (!genre) return Response.json({ items: url.searchParams.get('location') === SEARCH_STREETS[0] ? Array(100).fill(original) : [] });
    assert.equal(url.searchParams.get('location'), SEARCH_STREETS[0]);
    assert.ok(SUPPLEMENTAL_GENRES.includes(genre as typeof SUPPLEMENTAL_GENRES[number]));
    const newRow = fixture(`new-${SUPPLEMENTAL_GENRES.indexOf(genre as typeof SUPPLEMENTAL_GENRES[number])}`, genre);
    return Response.json({ items: [original, newRow, { ...fixture('outside'), xaxsVal: String(outsideX), yaxsVal: String(outsideY) }] });
  });
  const result = await loadRestaurants();
  assert.equal(calls.length, SEARCH_STREETS.length + SUPPLEMENTAL_GENRES.length);
  assert.deepEqual(result.restaurants.map(r => r.id).sort(), ['base', ...SUPPLEMENTAL_GENRES.map((_, i) => `new-${i}`)].sort());
  assert.ok(result.restaurants.every(isInArea));
  assert.deepEqual([...new Set(result.restaurants.map(r => r.category))].sort(), ['korean', 'noodles', 'meat', 'japanese', 'chinese', 'western', 'cafe'].sort());
  assert.equal(result.partial, false);
});

test('a failed supplemental category preserves baseline and other categories and reports partial data', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url: URL) => {
    calls++;
    const genre = url.searchParams.get('merTpbuzNm');
    if (genre === '카페') throw new Error('temporary upstream failure');
    if (genre) return Response.json({ items: [fixture('chinese', '기타중식')] });
    return Response.json({ items: url.searchParams.get('location') === SEARCH_STREETS[0] ? Array(100).fill(fixture('base')) : [] });
  });
  const result = await loadRestaurants();
  assert.equal(calls, SEARCH_STREETS.length + SUPPLEMENTAL_GENRES.length);
  assert.equal(result.partial, true);
  assert.deepEqual(result.restaurants.map(r => r.id).sort(), ['base', 'chinese']);
});

test('all capped roads cover every configured genre without exceeding the concurrency bound', async t => {
  let active = 0, peak = 0;
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: URL) => {
    calls.push(url.toString());
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, 1));
    active--;
    return Response.json({ items: url.searchParams.has('merTpbuzNm') ? [] : Array(100).fill(fixture('base')) });
  });
  const result = await loadRestaurants();
  assert.equal(calls.length, SEARCH_STREETS.length * (1 + SUPPLEMENTAL_GENRES.length));
  assert.equal(new Set(calls).size, calls.length);
  assert.ok(peak <= MAX_CONCURRENT_SEARCHES);
  assert.equal(result.partial, false);
  assert.equal(result.restaurants.length, 1);
});

test('provider throttling stops queued supplements without retrying or losing base results', async t => {
  let supplementaryCalls = 0;
  t.mock.method(globalThis, 'fetch', async (url: URL) => {
    if (url.searchParams.has('merTpbuzNm')) {
      supplementaryCalls++;
      return new Response('rate limited', { status: 429, headers: { 'Retry-After': '60' } });
    }
    return Response.json({ items: Array(100).fill(fixture('base')) });
  });
  const result = await loadRestaurants();
  assert.ok(supplementaryCalls <= MAX_CONCURRENT_SEARCHES);
  assert.equal(result.partial, true);
  assert.deepEqual(result.restaurants.map(r => r.id), ['base']);
});
