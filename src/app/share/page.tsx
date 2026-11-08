import { cache } from 'react';
import type { Metadata } from 'next';
import Explorer from '@/components/explorer';
import { loadRestaurants } from '@/lib/eatpl';
import { parseSharedIds, sharePath } from '@/lib/restaurants';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const getData = cache(async () => { try { return await loadRestaurants(); } catch { return undefined; } });
type Props = { searchParams: Promise<{ places?: string | string[] }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const ids = parseSharedIds(typeof params.places === 'string' ? params.places : null);
  const data = ids.length ? await getData() : undefined;
  const names = data?.restaurants.filter(r => ids.includes(r.id)).map(r => r.name) ?? [];
  const title = names.length ? names.join(' · ').slice(0, 120) : '함께 고른 맛집';
  return { title, description: '오늘은 여기서 같이 한 끼 어때요? 뱅뱅사거리 주변 맛집 후보를 확인해 보세요.', openGraph: { title: `${title} · 뱅뱅밥`, description: '함께 고른 우리 동네 맛집, 바로 확인해 보세요.', url: sharePath(ids), images: ['/og-image.png'], locale: 'ko_KR', type: 'website' } };
}
export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const ids = parseSharedIds(typeof params.places === 'string' ? params.places : null);
  if (!ids.length) return <main className="empty-state"><h1>공유할 맛집을 찾지 못했어요</h1><p>링크가 올바른지 확인하거나 동네 맛집을 둘러보세요.</p><a href="/" className="primary-button">맛집 지도 열기</a></main>;
  return <Explorer initialData={await getData()} sharedIds={ids}/>;
}
