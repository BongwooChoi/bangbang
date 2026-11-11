import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { browsingEnvironment, reportOutboundClick, type OutboundClick } from '../src/lib/outbound';
import { EatplLink } from '../src/components/eatpl-link';
import { POST } from '../src/app/api/outbound/route';
import { sharedContent } from '../src/lib/sharing';
import { SITE_URL } from '../src/lib/site';
import type { Restaurant } from '../src/lib/restaurants';

const click: OutboundClick = { event: 'eatpl_open', placement: 'detail', page: 'share', browser: 'browser', activation: 'same_tab' };
const request = (body: string, origin = 'https://example.test', extra = {}) => new Request('https://example.test/api/outbound', { method: 'POST', headers: { origin, 'content-type': 'text/plain;charset=UTF-8', ...extra }, body });

test('outbound anchors preserve the original provider URL and origin without requiring JavaScript', () => {
  const href = 'https://web.paybooc.ai/mer/web/profile/synthetic-test';
  for (const placement of ['list', 'detail'] as const) {
    const html = renderToStaticMarkup(createElement(EatplLink, { href, placement, children: 'Merchant details' }));
    assert.ok(html.includes(`href="${href}"`));
    assert.ok(html.includes('target="_self"'));
    assert.ok(html.includes('referrerPolicy="strict-origin-when-cross-origin"'));
    assert.ok(!html.includes('noreferrer'));
    assert.ok(!html.includes('/api/outbound'));
  }
});

test('in-app hints are limited to recognized webviews and never force a browser switch', () => {
  assert.equal(browsingEnvironment('Mozilla/5.0 Safari/604.1', false), 'browser');
  assert.equal(browsingEnvironment('Mozilla/5.0 Chrome/140.0 Safari/537.36', false), 'browser');
  for (const ua of ['KAKAOTALK/26.0', 'Instagram 300', '[FBAN/FBIOS;FBAV/1]', 'Line/14.0', 'Mozilla/5.0 (Linux; Android 14; wv)']) assert.equal(browsingEnvironment(ua, false), 'in_app');
  assert.equal(browsingEnvironment('KAKAOTALK/26.0', true), 'standalone');
});

test('share links use the canonical registered host rather than the viewing deployment alias', () => {
  const content = sharedContent([{ id: 'synthetic-test', name: 'Synthetic restaurant' } as Restaurant]);
  assert.equal(content.url, `${SITE_URL}/share?places=synthetic-test`);
});

test('diagnostics fall back on a rejected beacon and remain non-blocking when both transports fail', async () => {
  let fetches = 0;
  const fallback: typeof fetch = async (url, options) => {
    fetches++;
    assert.equal(url, '/api/outbound'); assert.equal(options?.keepalive, true);
    const body = JSON.parse(options?.body as string);
    assert.match(body.id, /^[0-9a-f-]{36}$/);
    delete body.id;
    assert.deepEqual(body, click);
    throw new Error('offline');
  };
  reportOutboundClick(click, { beacon: () => true, fetch: fallback });
  assert.equal(fetches, 0);
  reportOutboundClick(click, { beacon: () => false, fetch: fallback });
  reportOutboundClick(click, { beacon: () => { throw new Error('blocked'); }, fetch: fallback });
  reportOutboundClick(click, { fetch: () => { throw new Error('unavailable'); } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetches, 2);
});

test('click diagnostics reject foreign origins, oversized bodies and unexpected personal data', async () => {
  const messages: string[] = [];
  const original = console.info; console.info = value => { messages.push(value); };
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.STATS_DATABASE_URL;
  process.env.STATS_DATABASE_URL = 'postgresql://synthetic:synthetic@example.test/test';
  let writes = 0;
  globalThis.fetch = async () => { writes++; return Response.json({ fields: [{ name: 'clicks', dataTypeID: 20 }], rows: [['1']] }); };
  try {
    assert.equal((await POST(request(JSON.stringify(click), 'https://foreign.test'))).status, 403);
    assert.equal((await POST(request(JSON.stringify(click), 'null'))).status, 403);
    assert.equal((await POST(request(JSON.stringify(click), 'https://user@example.test'))).status, 403);
    assert.equal((await POST(request('x'.repeat(513)))).status, 413);
    assert.equal((await POST(request('x', 'https://example.test', { 'content-length': '999' }))).status, 413);
    assert.equal((await POST(request('{bad json'))).status, 400);
    assert.equal((await POST(request(JSON.stringify({ ...click, email: 'synthetic@example.test' })))).status, 400);
    assert.equal((await POST(request(JSON.stringify({ ...click, page: 'https://foreign.test/private' })))).status, 400);
    assert.equal(messages.length, 0);
    const response = await POST(request(JSON.stringify(click)));
    assert.equal(response.status, 204); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('location'), null);
    assert.equal(writes, 1);
    assert.equal(messages.length, 0);
    // Next.js may internally normalize request.url to localhost/a deployment alias.
    const rewritten = new Request('http://localhost:3000/api/outbound', { method: 'POST', headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000', 'content-type': 'text/plain' }, body: JSON.stringify(click) });
    assert.equal((await POST(rewritten)).status, 204);
  } finally { console.info = original; globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.STATS_DATABASE_URL; else process.env.STATS_DATABASE_URL = originalUrl;
  }
});
