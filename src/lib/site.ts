import type { Metadata } from 'next';

export const SITE_NAME = '뱅뱅밥';
export const SITE_TITLE = '뱅뱅사거리 맛집 지도 · 강남역·양재역 점심 추천';
export const SITE_DESCRIPTION = '“강남역 쪽 단골 많은 중식집”처럼 말해보세요. AI가 원하는 조건을 읽고, 강남역부터 양재역 사이의 점심·회식·카페 후보를 찾아드려요.';
export const SOCIAL_TITLE = '뱅뱅밥 · 말로 찾는 우리 동네 맛집';
export const SOCIAL_IMAGE = '/og-ai-search.png';
export const GUIDE_TITLE = '뱅뱅사거리 점심·회식·카페 찾는 법과 추천 기준';
export const GUIDE_DESCRIPTION = '뱅뱅밥의 강남역·양재역 맛집 지도 범위, 음식 종류·고객층 필터, 추천 기준, 잇플 데이터 출처와 한계를 안내합니다.';

export function canonicalOrigin(configured = process.env.NEXT_PUBLIC_SITE_URL): string {
  const url = new URL(configured || 'https://bangbang-five.vercel.app');
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTPS origin without credentials, path, query or fragment');
  }
  return url.origin;
}
export const SITE_URL = canonicalOrigin();
export const IS_PREVIEW = process.env.VERCEL_ENV === 'preview';
export const absoluteUrl = (path: string) => new URL(path, `${SITE_URL}/`).href;

export function pageMetadata(title: string, description: string, path: string, socialTitle = `${title} · ${SITE_NAME}`): Metadata {
  return {
    title: { absolute: `${title} · ${SITE_NAME}` }, description, alternates: { canonical: absoluteUrl(path) },
    openGraph: { title: socialTitle, description, url: absoluteUrl(path), siteName: SITE_NAME, locale: 'ko_KR', type: 'website', images: [{ url: absoluteUrl(SOCIAL_IMAGE), width: 1200, height: 630, alt: '뱅뱅밥 · 원하는 한 끼, AI에게 말해보세요.' }] },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [absoluteUrl(SOCIAL_IMAGE)] },
  };
}

// Escape HTML delimiters even if future content includes a literal script end tag.
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': absoluteUrl('/#website'),
  name: SITE_NAME, alternateName: 'Bangbang Bap', url: absoluteUrl('/'), description: SITE_DESCRIPTION,
  inLanguage: 'ko-KR', sameAs: ['https://github.com/BongwooChoi/bangbang'],
};
