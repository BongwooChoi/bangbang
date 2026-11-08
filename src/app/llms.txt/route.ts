import { absoluteUrl, SITE_DESCRIPTION } from '@/lib/site';
import { GUIDE_FAQS } from '@/lib/guide';

export const dynamic = 'force-static';
export function GET() {
  // A supplemental reading index, not an indexing protocol or a restaurant dataset.
  return new Response(`# 뱅뱅밥\n\n> ${SITE_DESCRIPTION}\n\n## 주요 페이지\n\n- [맛집 지도](${absoluteUrl('/')}): 지역·음식 종류·고객층 필터와 즐겨찾기, 공유\n- [지역 범위와 추천 안내](${absoluteUrl('/guide')}): 추천 기준, 데이터 출처와 한계\n- [사이트맵](${absoluteUrl('/sitemap.xml')})\n- [공개 소스코드](https://github.com/BongwooChoi/bangbang)\n\n## 서비스 설명\n\n${GUIDE_FAQS.map(item => `### ${item.question}\n\n${item.answer}`).join('\n\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
