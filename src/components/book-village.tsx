'use client';
import { useState, type CSSProperties } from 'react';
import { ArrowRight, Pause, Play, Search, Shuffle } from 'lucide-react';
import { type Category } from '@/lib/restaurants';
import { Mascot } from './mascot';

const shops: {category: Category; label: string; emoji: string; x: number; y: number; color: string; roof: string}[] = [
  {category:'korean',label:'한식',emoji:'🍚',x:9,y:12,color:'#f4d8a4',roof:'#bc795a'},
  {category:'noodles',label:'면·분식',emoji:'🍜',x:66,y:10,color:'#f2bfaa',roof:'#d98569'},
  {category:'western',label:'양식·기타',emoji:'🍝',x:8,y:37,color:'#e2c4c0',roof:'#a47c91'},
  {category:'cafe',label:'카페·간식',emoji:'☕',x:67,y:36,color:'#d8e3c2',roof:'#729b80'},
  {category:'chinese',label:'중식',emoji:'🥟',x:7,y:64,color:'#f1c5a3',roof:'#c98160'},
  {category:'meat',label:'고기',emoji:'🥩',x:67,y:65,color:'#e7b4a3',roof:'#a36c61'},
  {category:'japanese',label:'일식',emoji:'🍣',x:34,y:73,color:'#d6daba',roof:'#8c9b76'},
];

/** Flat artwork: roof, walls and shadow always share the same coordinates. */
export function PaperShop({ color, roof, emoji }: {color:string;roof:string;emoji:string}) {
  return <svg viewBox="0 0 140 138" aria-hidden="true" className="paper-shop-art">
    <ellipse cx="76" cy="124" rx="61" ry="11" fill="#647353" opacity=".14"/>
    <path d="M18 66H100V122H18Z" fill={color} stroke="#fff8e5" strokeWidth="2"/>
    <path d="M100 66 126 48V105L100 122Z" fill={color}/><path d="M100 66 126 48V105L100 122Z" fill="#344f3c" opacity=".18"/>
    <path d="M12 65 34 30H114L98 65Z" fill={roof} stroke="#fff5df" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M98 65 114 30 132 48 126 53 114 40 104 65Z" fill={roof}/>
    <path d="M98 65 114 30 132 48 126 53 114 40 104 65Z" fill="#344f3c" opacity=".15"/>
    <path d="M28 54H94M33 44H100" stroke="#fff5df" strokeWidth="2" opacity=".3"/>
    <path d="M108 25V9H119V30" fill={color} stroke="#fff5df" strokeWidth="2"/>
    <path className="paper-steam" d="M114 4q-7-8 0-15" fill="none" stroke="#b4b99b" strokeWidth="3" strokeLinecap="round"/>
    <rect x="26" y="78" width="34" height="33" rx="3" fill="#e9f1df" stroke="#fff7df" strokeWidth="4"/>
    <text x="43" y="103" textAnchor="middle" fontSize="25">{emoji}</text>
    <rect x="70" y="81" width="23" height="41" rx="2" fill="#6f927b" stroke="#fff0d3" strokeWidth="3"/>
    <circle cx="87" cy="104" r="2" fill="#f9deb2"/>
    <path d="M16 68H101L106 81H12Z" fill="#fff6db"/>
    <path d="M24 68 21 81M43 68 42 81M63 68 64 81M84 68 87 81" stroke={roof} strokeWidth="9"/>
    <path d="M111 70 119 65V81L111 86Z" fill="#f5e8c7"/>
    <path d="M22 122H98" stroke="#ba9f76" strokeWidth="3"/>
  </svg>;
}

export function BookVillage({ onBrowse, onCategory = onBrowse, onDraw, count, busy, error, onRetry }: { onBrowse: (category: Category) => void; onCategory?: (category: Category) => void; onDraw: () => void; count: number; busy: boolean; error: string; onRetry: () => void }) {
  const [paused,setPaused]=useState(false);
  return <div className={`village-chapter paper-village ${paused?'village-paused':''}`}>
    <div className="village-heading"><span className="book-kicker">CHAPTER 01 · 우리 동네 한 끼</span><h1>맛있는 골목으로<br/>놀러 오세요.</h1><p>뱅뱅사거리부터 강남역·양재역까지.<br/>마음 가는 가게를 톡, 맛집 지도가 열려요.</p><span className="paper-town-note">일곱 가지 맛이 모인 작은 동네</span></div>
    <div className="paper-town" role="group" aria-label="음식 종류별 종이 마을">
      <svg className="paper-town-land" viewBox="0 0 600 640" aria-hidden="true">
        <path d="M30 94Q290-8 565 98L590 558Q340 662 18 557Z" fill="#c3ceac"/>
        <path d="M30 82Q290-20 565 86L590 546Q340 650 18 545Z" fill="#e5e9cd" stroke="#f8f4df" strokeWidth="7"/>
        <path d="M285 42 380 605M20 354 585 398" fill="none" stroke="#fff9e8" strokeWidth="63"/>
        <path d="M285 42 380 605M20 354 585 398" fill="none" stroke="#d3c9ad" strokeWidth="49"/>
        <path d="M285 42 380 605M20 354 585 398" fill="none" stroke="#fff8df" strokeWidth="3" strokeDasharray="13 10"/>
        <path d="M70 203 309 223M365 500 560 515M80 510 355 532" fill="none" stroke="#f8f1d9" strokeWidth="16"/>
        <g stroke="#fff9e9" strokeWidth="5"><path d="M306 340 345 334M308 349 347 343M310 358 349 352M320 402 359 396M322 411 361 405M324 420 363 414"/></g>
        {[{x:45,y:280},{x:546,y:280},{x:454,y:575},{x:560,y:455},{x:175,y:584}].map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}><ellipse cy="27" rx="24" ry="8" fill="#8c9d72" opacity=".2"/><path d="M0 0V27" stroke="#ae8b62" strokeWidth="7"/><path d="M0-43C-36-29-36 11 0 14C34 10 36-29 0-43" fill={i%2?'#9eb789':'#b2c594'} stroke="#f2f0d9" strokeWidth="3"/><path d="M0-29V8" stroke="#748f66" strokeWidth="2" opacity=".4"/></g>)}
        <g fill="#fff9e7"><path d="M40 43q-10-17 9-21 9-20 24-3 24-3 21 17Z"/><path d="M459 33q-10-17 9-21 9-20 24-3 24-3 21 17Z"/></g>
        <g fill="#d9997b">{[{x:185,y:130},{x:423,y:300},{x:64,y:490},{x:502,y:589}].map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="4"/><circle cx={p.x+9} cy={p.y+3} r="3"/><circle cx={p.x+3} cy={p.y+10} r="3"/></g>)}</g>
      </svg>
      <span className="paper-town-sign">뱅뱅 맛있는 골목</span>
      <span className="paper-station station-gangnam"><i>2</i> 강남역 <small>1·8번 출구</small></span>
      <span className="paper-station station-yangjae"><i>3</i> 양재역 <small>1·4번 출구</small></span>
      <span className="paper-intersection">뱅뱅사거리</span><span className="paper-boulevard">강남대로</span>
      {shops.map(shop=><button key={shop.category} className="paper-shop" style={{left:`${shop.x}%`,top:`${shop.y}%`,'--shop-roof':shop.roof} as CSSProperties} onClick={()=>onCategory(shop.category)} aria-label={`${shop.label} 맛집 지도 펼치기`}><PaperShop color={shop.color} roof={shop.roof} emoji={shop.emoji}/><span className="paper-shop-label">{shop.label}<span>↗</span></span></button>)}
      <button className="paper-town-mascot" onClick={onDraw} disabled={busy||!count} aria-label="오늘의 한 집을 뽑아 잇플에서 바로 보기"><span className="paper-mascot-bubble">뭐 먹을까요?</span><Mascot size={62}/></button>
      <span className="paper-town-caption">음식 종류를 고르는 그림 지도예요</span>
    </div>
    <div className="village-controls paper-town-controls"><span>가게를 누르면 실제 매장 위치로!</span><button className="world-motion" aria-label={paused?'마을 움직임 켜기':'마을 움직임 끄기'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>
    <div className="village-actions"><button className="world-draw" onClick={onDraw} disabled={busy||!count}><Shuffle size={21}/>{busy?'맛집을 펼치는 중…':'한 집 뽑고 잇플 보기'}<ArrowRight size={18}/></button><button className="world-search" onClick={()=>onBrowse('all')}><Search size={18}/>원하는 조건으로 찾기</button></div>
    <p className="village-status" role="status">{error?<>{error} <button onClick={onRetry}>다시 불러오기</button></>:busy?'동네 맛집 정보를 가져오고 있어요.':`${count}곳의 후보 · 현재 후보에서 무작위로 골라 잇플로 바로 이동해요.`}</p>
  </div>;
}
