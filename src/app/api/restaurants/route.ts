import { loadRestaurants } from '@/lib/eatpl';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET() {
  try {
    return Response.json(await loadRestaurants(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '음식점 정보를 잠시 불러오지 못했어요. 잠깐 뒤 다시 시도해 주세요.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
