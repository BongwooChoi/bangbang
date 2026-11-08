import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { extractSearchIntent } from '../src/lib/ai-search';
import { SEARCH_MODEL, validateSearchIntent, searchIntentLabels } from '../src/lib/search-intent';
import { POST } from '../src/app/api/search/route';

const intent = { merNm: '', merTpbuzNm: '중국음식', category: 'all', excludedCategories: [], zone: 'gangnam', sort: 'recommended', localOnly: true, groupOnly: false, customerAge: 'all', customerGender: 'all', unsupported: [] };
const originalKey = process.env.OPENAI_API_KEY;
beforeEach(() => { process.env.OPENAI_API_KEY = 'synthetic-test-key'; });
afterEach(() => { if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; });
const completed = (value: unknown) => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });
const request = (input: unknown, extra: Record<string, string> = {}) => { const headers = new Headers({ 'Content-Type': 'application/json' }); Object.entries(extra).forEach(([key, value]) => headers.set(key, value)); return new Request('https://example.com/api/search', { method: 'POST', headers, body: JSON.stringify({ input }) }); };

test('model request uses the chosen model, strict schema, no storage and only user input', async t => {
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, SEARCH_MODEL);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.input, '강남역 쪽 단골 많은 중식집');
    assert.equal(body.reasoning.effort, 'none');
    assert.equal(options?.cache, 'no-store');
    assert.ok(options?.signal);
    return completed(intent);
  });
  assert.deepEqual(await extractSearchIntent('강남역 쪽 단골 많은 중식집'), intent);
});
test('invalid conditions never reach search and labels preserve customer combination and exclusions', () => {
  for (const value of [{ ...intent, zone: 'busan' }, { ...intent, merTpbuzNm: 'invented' }, { ...intent, url: 'https://evil.test' }, { ...intent, merNm: 'x'.repeat(61) }, { ...intent, localOnly: 'true' }, { ...intent, excludedCategories: ['all'] }, { ...intent, unsupported: ['가격 충족'] }, {}]) assert.throws(() => validateSearchIntent(value), /invalid_search_intent/);
  const labels = searchIntentLabels(validateSearchIntent({ ...intent, excludedCategories: ['cafe'], customerAge: '30', customerGender: 'female', unsupported: ['가격·예산'] }));
  assert.ok(labels.includes('30대 여성 주요 방문 고객층'));
  assert.ok(labels.includes('카페·간식 제외'));
});
test('provider failures, incomplete responses and refusals do not become fake search conditions', async t => {
  for (const response of [new Response('private upstream diagnostic', { status: 401 }), Response.json({ status: 'incomplete' }), Response.json({ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }), completed({ ...intent, category: 'unknown' })]) {
    const mocked = t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(extractSearchIntent('테스트')); mocked.mock.restore();
  }
});
test('search route passes extracted parameters into bounded restaurant API queries', async t => {
  const calls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options?: RequestInit) => {
    if (String(url).includes('api.openai.com')) return completed({ ...intent, merNm: '가상식당' });
    const query = new URL(String(url)); calls.push(query);
    assert.equal(query.searchParams.get('merNm'), '가상식당');
    assert.equal(query.searchParams.get('merTpbuzNm'), '중국음식');
    assert.ok(query.searchParams.get('location'));
    assert.equal(options?.cache, 'no-store');
    return Response.json({ items: [] });
  });
  const response = await POST(new Request('http://localhost:3000/api/search', { method: 'POST', headers: { 'content-type': 'application/json', host: 'example.com', origin: 'https://example.com', 'x-vercel-forwarded-for': '192.0.2.1' }, body: JSON.stringify({ input: '강남역 중식' }) }));
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(calls.length, 5);
  const body = await response.json(); assert.equal(body.intent.zone, 'gangnam');
  assert.deepEqual(body.data.restaurants, []); assert.ok(!JSON.stringify(body).includes('synthetic-test-key'));
});
test('route rejects invalid, oversized and cross-origin requests before spending tokens', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => { throw new Error('must_not_call'); });
  for (const input of ['', 'x'.repeat(301), 12, null]) assert.equal((await POST(request(input))).status, 400);
  assert.equal((await POST(request('카페', { origin: 'https://evil.test' }))).status, 403);
  assert.equal((await POST(request('카페', { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await POST(request('x'.repeat(5000)))).status, 413);
  assert.equal(mocked.mock.callCount(), 0);
});
test('AI errors are sanitized and repeated requests hit a bounded rate limit', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => new Response('sensitive upstream error', { status: 500 }));
  for (let i = 0; i < 6; i++) {
    const response = await POST(request('카페', { 'x-vercel-forwarded-for': '192.0.2.2' }));
    assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('sensitive'));
  }
  const limited = await POST(request('카페', { 'x-vercel-forwarded-for': '192.0.2.2' }));
  assert.equal(limited.status, 429); assert.equal(limited.headers.get('Retry-After'), '60');
  assert.equal(mocked.mock.callCount(), 6);
});
