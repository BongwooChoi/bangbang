import { parseOutboundClick } from '@/lib/outbound';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const MAX_BYTES = 512;
export async function POST(request: Request) {
  // Only accept our own browser's diagnostic POST; never visit or redirect to eat.pl.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? new URL(request.url).host;
  let sameOrigin = false;
  try { if (origin) { const url = new URL(origin); sameOrigin = url.origin === origin && url.host === host && /^https?:$/.test(url.protocol); } } catch { /* Invalid origin. */ }
  if (!sameOrigin) return new Response(null, { status: 403, headers });
  if (!request.headers.get('content-type')?.startsWith('text/plain')) return new Response(null, { status: 415, headers });
  if (Number(request.headers.get('content-length')) > MAX_BYTES) return new Response(null, { status: 413, headers });
  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400, headers });
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return new Response(null, { status: 413, headers }); }
      chunks.push(part.value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return new Response(null, { status: 400, headers }); }
  const event = parseOutboundClick(payload);
  if (!event) return new Response(null, { status: 400, headers });
  // Short-lived Vercel runtime diagnostics, NOT durable analytics or verified unique users.
  // Do not log IPs, user agents, merchant data, search text, full URLs, or browser identifiers.
  console.info(JSON.stringify({ ...event, recordedAt: new Date().toISOString() }));
  return new Response(null, { status: 204, headers });
}
