import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRestaurants, SEARCH_STREETS } from '../src/lib/eatpl';

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
