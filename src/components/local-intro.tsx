import Link from 'next/link';

export function LocalIntro() {
  return <section className="local-intro" aria-labelledby="local-guide-heading">
    <span className="guide-eyebrow">우리 동네 한 끼 안내서</span>
    <h2 id="local-guide-heading">뱅뱅사거리에서 점심, 회식, 카페까지</h2>
    <p>뱅뱅밥은 강남역 1·8번 출구부터 양재역 1·4번 출구 사이의 음식점 후보를 찾는 지도예요. 한식·중식·일식·고기·면·분식·양식·카페를 비교하고, 마음에 드는 곳을 담아 동료에게 공유해 보세요.</p>
    <p>eat.pl 잇플의 BC카드 결제 데이터를 바탕으로 직선거리, 지역 매출 순위, 동네 단골 여부를 추천 근거로 보여드려요. 조회 가능한 후보를 제공하며 실제 영업시간·대기 시간은 방문 전 확인해 주세요.</p>
    <Link href="/guide" className="guide-link">지역 범위와 맛집 고르는 법 읽기 <span aria-hidden="true">→</span></Link>
  </section>;
}
