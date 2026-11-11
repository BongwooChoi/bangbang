'use client';
import { ArrowRight, Share2 } from 'lucide-react';
import type { Restaurant } from '@/lib/restaurants';
import { EatplLink } from './eatpl-link';

export function RestaurantNextStep({ restaurant, onShare, onBack }: {
  restaurant: Restaurant; onShare: () => void; onBack: () => void;
}) {
  return <div className="restaurant-next-step">
    <p className="next-step-prompt">여기서 한 끼 어때요?</p>
    <EatplLink href={restaurant.eatplUrl} placement="detail" className="primary-button" aria-label={`${restaurant.name} 잇플에서 메뉴·지도 보기`} aria-describedby="eatpl-destination">
      메뉴·지도 보기 <ArrowRight size={18}/>
    </EatplLink>
    <p id="eatpl-destination">잇플에서 확인해요. 매장별 제공 정보는 달라요.</p>
    <div className="next-step-options"><button onClick={onBack}>후보 더 보기</button><button onClick={onShare}><Share2 size={15}/> 같이 먹을 사람에게 공유</button></div>
  </div>;
}
