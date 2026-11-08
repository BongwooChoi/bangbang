import { createHash } from 'node:crypto';
import { extractSearchIntent } from '@/lib/ai-search';
import { loadRestaurants } from '@/lib/eatpl';
import { MAX_SEARCH_LENGTH } from '@/lib/search-intent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'no-store' };
// Best-effort warm-instance limits; not a distributed billing quota.
const requests = new Map<string, { count: number; until: number }>();
let total = { count: 0, until: 0 };
function allow(request: Request): boolean {
  const now = Date.now();
  if (now >= total.until) total = { count: 0, until: now + 60_000 };
  for (const [key, entry] of requests) if (now >= entry.until) requests.delete(key);
  const ip = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const key = createHash('sha256').update(ip).digest('hex');
  const current = requests.get(key) ?? { count: 0, until: now + 60_000 };
  if (current.count >= 6 || total.count >= 60 || requests.size >= 2000) return false;
  current.count++; total.count++; requests.set(key, current);
  return true;
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? new URL(request.url).host;
  let sameOrigin = true;
  try { if (origin) sameOrigin = new URL(origin).host === host; } catch { sameOrigin = false; }
  if (!sameOrigin) return Response.json({ error: '이 페이지에서 다시 검색해 주세요.' }, { status: 403, headers });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return Response.json({ error: '검색 조건 형식을 확인해 주세요.' }, { status: 415, headers });
  if (Number(request.headers.get('content-length')) > 4096) return Response.json({ error: '검색 조건은 300자 이내로 입력해 주세요.' }, { status: 413, headers });
  let input: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('empty_body');
    let length = 0;
    const chunks: Uint8Array[] = [];
    for (;;) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength; if (length > 4096) { await reader.cancel(); return Response.json({ error: '검색 조건은 300자 이내로 입력해 주세요.' }, { status: 413, headers }); } chunks.push(part.value); }
    input = JSON.parse(Buffer.concat(chunks).toString('utf8')).input;
  } catch { return Response.json({ error: '검색 조건을 다시 입력해 주세요.' }, { status: 400, headers }); }
  if (typeof input !== 'string' || !input.trim() || input.trim().length > MAX_SEARCH_LENGTH) return Response.json({ error: '원하는 조건을 1~300자로 입력해 주세요.' }, { status: 400, headers });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: 'AI 검색을 준비 중이에요. 아래 필터로 맛집을 찾아주세요.' }, { status: 503, headers });
  if (!allow(request)) return Response.json({ error: '검색 요청이 많아요. 1분 뒤 다시 시도해 주세요.' }, { status: 429, headers: { ...headers, 'Retry-After': '60' } });
  try {
    const intent = await extractSearchIntent(input.trim(), request.signal);
    const data = await loadRestaurants(intent);
    return Response.json({ intent, data }, { headers });
  } catch {
    return Response.json({ error: '조건을 해석하거나 맛집을 조회하지 못했어요. 다시 검색하거나 아래 필터를 이용해 주세요.' }, { status: 503, headers });
  }
}
