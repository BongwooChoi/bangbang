import Link from 'next/link';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('개인정보 처리 안내', '뱅뱅밥의 즐겨찾기 저장, 위치 권한, AI 검색, 이용 통계와 문의 방법을 안내합니다.', '/privacy');

export default function PrivacyPage() {
  return <main className="guide-page">
    <Link href="/" className="guide-link">뱅뱅밥 맛집 지도로 →</Link>
    <h1>개인정보 처리 안내</h1>
    <section className="guide-section"><h2>즐겨찾기와 위치</h2>
      <p>담은 매장의 식별자는 사용 중인 브라우저에 저장됩니다. 담기를 해제하거나 브라우저에서 이 사이트의 데이터를 삭제하면 지울 수 있습니다. ‘내 위치’를 누르고 권한을 허용하면 브라우저가 위치를 확인해 지도에 표시합니다. 배경 지도를 표시할 때는 지도 타일 제공자에게 해당 영역의 이미지를 요청합니다.</p></section>
    <section className="guide-section"><h2>AI 검색과 공유</h2>
      <p>AI 검색을 실행하면 입력한 문장을 OpenAI에 보내 조건을 추출하고, 가게명·업종 등 필요한 조건으로 잇플을 조회합니다. 검색창에 이름이나 전화번호를 입력하지 마세요. 공유 링크에는 선택한 매장의 식별자가 들어갑니다.</p></section>
    <section className="guide-section"><h2>서비스 이용 통계</h2>
      <p>방문 통계에는 Vercel Web Analytics를 사용합니다. 잇플 이동 클릭은 날짜, 버튼 위치, 브라우저 유형별로 집계합니다. 중복 집계를 막기 위한 무작위 클릭 식별자는 7일간 보관합니다. AI 검색의 호출 횟수를 제한할 때는 IP 주소의 해시값을 서버 메모리에서 사용합니다.</p></section>
    <section className="guide-section"><h2>문의</h2>
      <p>동작이나 데이터 처리에 관한 질문은 뱅뱅밥 공개 저장소에 남길 수 있습니다. 공개 글에는 개인 연락처를 적지 마세요.</p>
      <a className="guide-link" href="https://github.com/BongwooChoi/bangbang/issues">뱅뱅밥 운영자에게 문의하기 →</a></section>
  </main>;
}
