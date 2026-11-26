import { loadRestaurants } from '@/lib/eatpl';
import { directoryError, directoryStreamType, type DirectoryEvent } from '@/lib/restaurant-stream';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store, no-transform', Vary: 'Accept' };
  if (request.headers.get('Accept')?.includes(directoryStreamType)) {
    const cancel = new AbortController();
    const signal = AbortSignal.any([request.signal, cancel.signal]);
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: DirectoryEvent) => {
          if (!signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        };
        const sent = new Set<string>();
        try {
          const data = await loadRestaurants({}, { signal, onBase(base) {
            for (const row of base.restaurants) sent.add(row.id);
            send({ phase: 'base', batch: base });
          } });
          send({ phase: 'complete', batch: { ...data, restaurants: data.restaurants.filter(row => !sent.has(row.id)) } });
        } catch {
          send({ phase: 'error' });
        } finally {
          if (!cancel.signal.aborted) controller.close();
        }
      },
      cancel() { cancel.abort(); },
    });
    return new Response(body, { headers: { ...headers, 'Content-Type': directoryStreamType + '; charset=utf-8' } });
  }
  try {
    return Response.json(await loadRestaurants({}, { signal: request.signal }), { headers });
  } catch {
    return Response.json({ error: directoryError }, { status: 503, headers });
  }
}
