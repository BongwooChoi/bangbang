import Link from 'next/link';
import { Mascot } from '@/components/mascot';
import { GUIDE_FAQS, GUIDE_UPDATED } from '@/lib/guide';
import { absoluteUrl, GUIDE_DESCRIPTION, GUIDE_TITLE, pageMetadata, serializeJsonLd } from '@/lib/site';

export const metadata = pageMetadata(GUIDE_TITLE, GUIDE_DESCRIPTION, '/guide');

export default function GuidePage() {
  const schema = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'FAQPage', '@id': absoluteUrl('/guide#page'), url: absoluteUrl('/guide'), name: GUIDE_TITLE, description: GUIDE_DESCRIPTION, inLanguage: 'ko-KR', dateModified: GUIDE_UPDATED, isPartOf: { '@id': absoluteUrl('/#website') }, mainEntity: GUIDE_FAQS.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '뱅뱅밥 맛집 지도', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: '지역·추천 안내', item: absoluteUrl('/guide') }] },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}/>
    <header className="guide-header"><Link href="/" aria-label="뱅뱅밥 맛집 지도로"><Mascot size={42}/><strong>뱅뱅밥</strong></Link><Link href="/" className="guide-link">맛집 지도 열기 →</Link></header>
    <main className="guide-page">
      <nav aria-label="현재 위치" className="guide-breadcrumb"><Link href="/">맛집 지도</Link><span aria-hidden="true"> / </span><span>지역·추천 안내</span></nav>
      <span className="guide-eyebrow">우리 동네 한 끼 안내서</span>
      <h1>뱅뱅사거리 점심·회식·카페,<br/>이렇게 골라보세요.</h1>
      <p className="guide-lead">강남역과 양재역 사이에서 오늘의 한 끼를 고민하는 직장인을 위한 지도예요. 뱅뱅밥이 어디까지 찾고, 무엇을 근거로 추천하는지 알려드릴게요.</p>
      <p className="guide-date">안내 업데이트 <time dateTime={GUIDE_UPDATED}>2026년 11월 8일</time></p>
      <nav aria-label="안내 목차" className="guide-toc">{GUIDE_FAQS.map(item => <a key={item.id} href={`#${item.id}`}>{item.question}</a>)}</nav>
      {GUIDE_FAQS.map(item => <section key={item.id} id={item.id} className="guide-section"><h2>{item.question}</h2><p>{item.answer}</p></section>)}
      <section className="guide-section"><h2>데이터 출처와 함께 만드는 방법</h2>
        <p>뱅뱅밥은 BC카드의 공식 서비스가 아닙니다. 지도는 Leaflet과 OpenStreetMap을 사용하며, 추천 기준과 기능은 공개 소스코드에서 확인할 수 있어요.</p>
        <ul><li><a href="https://eatpl.dothome.co.kr/api">잇플 API 정의서: 데이터 항목과 의미</a></li><li><a href="https://github.com/NomaDamas/k-skill/tree/main/bccard-eatpl-search">k-skill 잇플 연동</a></li><li><a href="https://www.openstreetmap.org/copyright">OpenStreetMap 지도 출처</a></li><li><a href="https://github.com/BongwooChoi/bangbang">뱅뱅밥 공개 소스코드</a> · <a href="https://github.com/BongwooChoi/bangbang/issues">오류·개선 의견 남기기</a></li></ul>
      </section>
      <Link href="/" className="primary-button guide-cta">오늘의 맛집 후보 보러 가기 →</Link>
    </main>
  </>;
}
