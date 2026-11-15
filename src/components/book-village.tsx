'use client';
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, Search, Shuffle } from 'lucide-react';
import { type Category } from '@/lib/restaurants';
import { Mascot } from './mascot';

const shops: {category: Category; label: string; emoji: string; x: number; y: number; color: string; roof: string}[] = [
  {category:'korean',label:'한식',emoji:'🍚',x:80,y:65,color:'#f4d8a4',roof:'#bd7f60'},
  {category:'noodles',label:'면·분식',emoji:'🍜',x:245,y:40,color:'#f2bfaa',roof:'#d9876c'},
  {category:'cafe',label:'카페·간식',emoji:'☕',x:435,y:65,color:'#d8e3c2',roof:'#7d9e88'},
  {category:'chinese',label:'중식',emoji:'🥟',x:85,y:285,color:'#f1c5a3',roof:'#c98160'},
  {category:'meat',label:'고기',emoji:'🥩',x:270,y:300,color:'#e7b4a3',roof:'#a36c61'},
  {category:'japanese',label:'일식',emoji:'🍣',x:455,y:280,color:'#d6daba',roof:'#8c9b76'},
];

export function BookVillage({ onBrowse, onDraw, count, busy, error, onRetry }: { onBrowse: (category: Category) => void; onDraw: () => void; count: number; busy: boolean; error: string; onRetry: () => void }) {
  const [angle, setAngle] = useState(-20);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ id: number; x: number; y: number; angle: number; rotating: boolean } | null>(null);
  const suppressClick = useRef(false);
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    // A second finger belongs to the browser's pinch gesture, not the rotation.
    if (!event.isPrimary) {
      const active = gesture.current;
      gesture.current = null; setDragging(false);
      if (active && event.currentTarget.hasPointerCapture(active.id)) event.currentTarget.releasePointerCapture(active.id);
      return;
    }
    if (event.button !== 0) return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, angle, rotating: false };
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    const dx = event.clientX - active.x, dy = event.clientY - active.y;
    if (!active.rotating) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      // Leave vertical swipes to normal page scrolling, even if they later curve.
      if (Math.abs(dy) >= Math.abs(dx)) { gesture.current = null; return; }
      active.rotating = true; suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    setAngle(Math.max(-38, Math.min(16, active.angle + dx * .25)));
  }
  return <div className={`village-chapter ${paused ? 'village-paused' : ''}`}>
    <div className="village-heading"><span className="book-kicker">CHAPTER 01 · 우리 동네 한 끼</span><h1>오늘은 어느 집을<br className="village-break"/> 펼쳐볼까요?</h1><p>뱅뱅사거리부터 강남역·양재역까지.<br/>책 속 가게를 누르면 맛집이 펼쳐져요.</p></div>
    <div className={`world-camera ${dragging ? 'is-dragging' : ''}`} style={{ '--village-angle': `${angle}deg` } as CSSProperties}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
      onLostPointerCapture={event => { if (event.target === event.currentTarget) endDrag(event); }}
      onPointerLeave={() => { if (!gesture.current?.rotating) gesture.current = null; }}
      onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); } }}>
      <div className="world-orbit">
        <div className="village-plane">
          <div className="village-cover"/><div className="village-page village-page-left"/><div className="village-page village-page-right"/><div className="village-binding"/>
          <div className="village-road road-horizontal"/><div className="village-road road-vertical"/>
          <div className="village-crosswalk"/>
          <div className="village-grass grass-one"/><div className="village-grass grass-two"/>
          {shops.map((shop,i)=><button type="button" className="world-shop" key={shop.category} onClick={()=>onBrowse(shop.category)} aria-label={`${shop.label} 맛집 펼치기`} style={{left:shop.x,top:shop.y,'--shop-color':shop.color,'--roof-color':shop.roof,'--shop-delay':`${i*65}ms`} as CSSProperties}>
            <span className="shop-foot"/>
            <span className="shop-building" aria-hidden="true">
              <span className="shop-wall shop-back"/><span className="shop-wall shop-left"/><span className="shop-wall shop-right"/>
              <span className="shop-wall shop-front"><span className="shop-sign">{shop.label}</span><span className="shop-awning"/><span className="shop-window">{shop.emoji}</span><span className="shop-door"/></span>
              <span className="shop-roof"/><span className="shop-roof-edge"/>
            </span>
            <span className="shop-paper-tab" aria-hidden="true">{shop.label} ↗</span>
          </button>)}
          <div className="world-tree tree-one" aria-hidden="true"><i/><b/><em/></div><div className="world-tree tree-two" aria-hidden="true"><i/><b/><em/></div>
          <button type="button" className="world-mascot" onClick={onDraw} disabled={busy||!count} aria-label="밥그릇에게 오늘의 한 집 추천받기"><span><Mascot size={74}/></span></button>
          <span className="world-place" aria-hidden="true">뱅뱅사거리</span>
          <span className="world-bookmark" aria-hidden="true"/>
        </div>
      </div>
      <div className="world-location location-north">강남역 <span>↑</span></div><div className="world-location location-south"><span>↓</span> 양재역</div>
    </div>
    <div className="village-controls"><button onClick={()=>setAngle(v=>Math.max(-38,v-12))} disabled={angle<=-38} aria-label="동네 왼쪽으로 돌리기"><ArrowLeft size={16}/></button><span>좌우로 밀어 회전 · 가게를 톡</span><button onClick={()=>setAngle(v=>Math.min(16,v+12))} disabled={angle>=16} aria-label="동네 오른쪽으로 돌리기"><ArrowRight size={16}/></button><button className="world-motion" aria-label={paused?'팝업북 움직임 켜기':'팝업북 움직임 끄기'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>
    <div className="village-actions"><button className="world-draw" onClick={onDraw} disabled={busy||!count}><Shuffle size={21}/>{busy?'맛집을 펼치는 중…':'오늘의 한 집 뽑기'}<ArrowRight size={18}/></button><button className="world-search" onClick={()=>onBrowse('all')}><Search size={18}/>원하는 조건으로 찾기</button></div>
    <p className="village-status" role="status">{error?<>{error} <button onClick={onRetry}>다시 불러오기</button></>:busy?'동네 맛집 정보를 가져오고 있어요.':`${count}곳의 후보 · 한 집 뽑기는 현재 후보에서 무작위로 골라요.`}</p>
  </div>;
}
