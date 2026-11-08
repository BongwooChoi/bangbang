'use client';
import { useState } from 'react';
import { ArrowRight, Clock3, Info, Sparkles } from 'lucide-react';
import type { Restaurant } from '@/lib/restaurants';
import { busyDayLabel, busyPeriodLabel, recommendationReasons, RECOMMENDATION_WEIGHTS } from '@/lib/recommendation';
import { Dialog } from './dialog';

export function RecommendationHelp() {
  const [open, setOpen] = useState(false);
  return <>
    <button className="recommendation-help" onClick={() => setOpen(true)}><Info size={14}/> 추천 기준</button>
    {open && <Dialog title="이렇게 한 끼를 추천해요" onClose={() => setOpen(false)}>
      <p className="recommendation-intro">지금 고른 지역과 음식 종류 안에서, 세 가지를 함께 살펴봐요.</p>
      <dl className="recommendation-weights">
        <div><dt>가까운 거리 <strong>{RECOMMENDATION_WEIGHTS.distance}%</strong></dt><dd>뱅뱅사거리와 가까울수록 높아요. 직선거리 0m에서 최대, 1.5km 이상에서 0점이에요.</dd></div>
        <div><dt>지역 매출 순위 <strong>{RECOMMENDATION_WEIGHTS.localRank}%</strong></dt><dd>같은 시·군·구, 같은 업종에서 매출이 상위일수록 높아요. 순위 정보가 없으면 이 항목은 0점으로 계산해요.</dd></div>
        <div><dt>동네 단골 <strong>{RECOMMENDATION_WEIGHTS.localFavorite}%</strong></dt><dd>동네 고객 비율이 지역 평균보다 높은 곳에 더해요.</dd></div>
      </dl>
      <p className="fine-print">뱅뱅밥이 정한 조합 기준이며 맛·별점 점수나 개인 취향 학습 결과는 아니에요. 같은 점수면 가까운 곳부터 보여드려요. 회식 필터는 저녁 단체 결제 이력이 있는 곳만 남겨요.</p>
      <p className="fine-print">혼잡 안내는 최근 1개월 기준이에요. 가장 붐비는 요일과 시간대는 각각의 집계이며, 지금 대기 상황이나 특정 요일의 해당 시간대가 붐빈다는 뜻은 아니에요. 혼잡 정보는 추천 점수에 넣지 않아요.</p>
    </Dialog>}
  </>;
}

export function RecommendationReasons({ restaurant }: { restaurant: Restaurant }) {
  return <p className="recommendation-reasons"><Sparkles size={12}/><span>{recommendationReasons(restaurant).join(' · ')}</span></p>;
}

export function RecommendedPick({ restaurant, onSelect }: { restaurant?: Restaurant; onSelect: (r: Restaurant) => void }) {
  if (!restaurant) return null;
  return <button className="recommended-pick" onClick={() => onSelect(restaurant)} aria-label={`조건에 맞는 추천: ${restaurant.name} 상세 보기`}>
    <span className="pick-icon" aria-hidden="true">🍀</span>
    <span className="pick-content"><small>조건에 맞는 추천 · 먼저 살펴봐요</small><strong>{restaurant.name}</strong><span>{recommendationReasons(restaurant).join(' · ')}</span></span>
    <ArrowRight size={17}/>
  </button>;
}

export function BusySummary({ restaurant }: { restaurant: Restaurant }) {
  const period = busyPeriodLabel(restaurant.busyTime);
  if (!period) return null;
  return <p className="busy-summary"><Clock3 size={12}/><span>평소 붐비는 시간대: {period}</span></p>;
}

export function BusyDetails({ restaurant }: { restaurant: Restaurant }) {
  return <div className="busy-details">
    <h4><Clock3 size={15}/> 방문 전에 살펴봐요</h4>
    <dl><div><dt>평소 가장 붐비는 요일</dt><dd>{busyDayLabel(restaurant.busyDay) || '미확인'}</dd></div>
      <div><dt>평소 가장 붐비는 시간대</dt><dd>{busyPeriodLabel(restaurant.busyTime) || '미확인'}</dd></div></dl>
    <p>최근 1개월의 요일·시간대별 집계예요. 실시간 대기 정보는 아니에요.</p>
  </div>;
}
