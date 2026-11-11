import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizedStats } from '../src/lib/click-stats';
import { parseOutboundClick } from '../src/lib/outbound';
import { GET } from '../src/app/api/stats/route';
import { POST } from '../src/app/api/outbound/route';

test('stats deny missing, malformed and incorrect credentials; support browser Basic and Bearer', () => {
  const token = 'synthetic-test-token-'.repeat(3);
  const req = (value: string) => new Request('https://example.test/api/stats', { headers: { authorization: value } });
  assert.equal(authorizedStats(req(''), token), false);
  assert.equal(authorizedStats(req(`Bearer ${token}`), token), true);
  assert.equal(authorizedStats(req(`Basic ${Buffer.from(`admin:${token}`).toString('base64')}`), token), true);
  assert.equal(authorizedStats(req(`Basic ${Buffer.from(`other:${token}`).toString('base64')}`), token), false);
  assert.equal(authorizedStats(req('Bearer wrong'), token), false);
  assert.equal(authorizedStats(req('Basic !!!'), token), false);
  assert.equal(authorizedStats(req('Bearer short'), 'short'), false);
});

test('stats endpoint challenges before reading storage, rejects unbounded periods', async () => {
  const original = process.env.STATS_ADMIN_TOKEN;
  process.env.STATS_ADMIN_TOKEN = 'synthetic-test-token-'.repeat(3);
  try {
    const denied = await GET(new Request('https://example.test/api/stats'));
    assert.equal(denied.status, 401);
    assert.equal(denied.headers.get('cache-control'), 'private, no-store');
    assert.equal(denied.headers.get('x-robots-tag'), 'noindex, nofollow');
    for (const days of ['0', '367', 'abc', '1.5']) {
      assert.equal((await GET(new Request(`https://example.test/api/stats?days=${days}`, { headers: { authorization: `Bearer ${process.env.STATS_ADMIN_TOKEN}` } }))).status, 400);
    }
  } finally { if (original === undefined) delete process.env.STATS_ADMIN_TOKEN; else process.env.STATS_ADMIN_TOKEN = original; }
});

test('only random click UUIDs are accepted; missing storage reports failure instead of pretending to count', async () => {
  const click = { event: 'eatpl_open', placement: 'list', page: 'home', browser: 'browser', activation: 'same_tab' };
  assert.ok(parseOutboundClick({ ...click, id: 'd431c117-3daf-4a98-b756-8ed096702369' }));
  assert.equal(parseOutboundClick({ ...click, id: 'person@example.test' }), null);
  const url = process.env.STATS_DATABASE_URL; const fallback = process.env.STATS_URL;
  delete process.env.STATS_DATABASE_URL; delete process.env.STATS_URL;
  const error = console.error; const errors: string[] = []; console.error = value => errors.push(value);
  try {
    const response = await POST(new Request('https://example.test/api/outbound', { method: 'POST', headers: { origin: 'https://example.test', 'content-type': 'text/plain' }, body: JSON.stringify(click) }));
    assert.equal(response.status, 503); assert.equal(response.headers.get('location'), null);
    assert.deepEqual(errors, ['outbound_storage_failed']);
  } finally {
    console.error = error;
    if (url !== undefined) process.env.STATS_DATABASE_URL = url;
    if (fallback !== undefined) process.env.STATS_URL = fallback;
  }
});
