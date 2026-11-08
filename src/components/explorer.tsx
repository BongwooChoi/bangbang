'use client';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDownUp, ArrowRight, Bookmark, Check, ChevronDown, ChevronRight, Copy, ExternalLink, Heart, Info, List, Map as MapIcon, MessageCircle, RefreshCw, Search, Share2, Shuffle, Smartphone, UsersRound, X } from 'lucide-react';
import { CATEGORIES, categoryInfo, filterRestaurants, type Category, type Restaurant, type RestaurantResponse } from '@/lib/restaurants';
import type { Zone } from '@/lib/geo';
import { kakaoShare, sharedContent } from '@/lib/sharing';
import { Mascot } from './mascot';
import { Dialog } from './dialog';
import { CustomerDetails, CustomerFilter, CustomerMatch } from './customer-filter';
import type { CustomerAge, CustomerGender } from '@/lib/customers';
import { compareRecommended } from '@/lib/recommendation';
import { BusyDetails, BusySummary, RecommendationHelp, RecommendationReasons, RecommendedPick } from './recommendation';

const MapView = dynamic(() => import('./map-view'), { ssr: false, loading: () => <div className="map-loading"><Mascot/><span>동네 지도를 펼치는 중이에요…</span></div> });
const zones: { id: Zone; label: string }[] = [{ id: 'all', label: '동네 전체' }, { id: 'bangbang', label: '뱅뱅사거리' }, { id: 'gangnam', label: '강남역 쪽' }, { id: 'yangjae', label: '양재역 쪽' }];
type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function Explorer({ initialData, sharedIds = [], children }: { initialData?: RestaurantResponse; sharedIds?: string[]; children?: ReactNode }) {
  const [data, setData] = useState<RestaurantResponse | undefined>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [zone, setZone] = useState<Zone>('all');
  const [sort, setSort] = useState('recommended');
  const [localOnly, setLocalOnly] = useState(false);
  const [groupOnly, setGroupOnly] = useState(false);
  const [customerAge, setCustomerAge] = useState<CustomerAge>('all');
  const [customerGender, setCustomerGender] = useState<CustomerGender>('all');
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sharedOnly, setSharedOnly] = useState(sharedIds.length > 0);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [shareRows, setShareRows] = useState<Restaurant[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [visibleCount, setVisibleCount] = useState(20);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nativeShare, setNativeShare] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<ServiceWorker | null>(null);
  const toast = useCallback((message: string) => setNotice(message), []);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/restaurants', { cache: 'no-store', signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '음식점 정보를 불러오지 못했어요.');
      setData(result);
    } catch (err) { if (!(err instanceof Error && err.name === 'AbortError')) setError(err instanceof Error ? err.message : '연결을 확인하고 다시 시도해 주세요.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { if (initialData) return; const controller = new AbortController(); void refresh(controller.signal); return () => controller.abort(); }, [initialData, refresh]);
  useEffect(() => {
    setMounted(true); setNativeShare(typeof navigator.share === 'function');
    try { const values = JSON.parse(localStorage.getItem('bangbang-saved') || '[]'); if (Array.isArray(values)) setSaved(values.filter((id: unknown) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id)).slice(0, 50)); } catch { /* Private browsing still supports browsing. */ }
    const handler = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      void navigator.serviceWorker.register('/sw.js').then(reg => {
        if (reg.waiting) setUpdateAvailable(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateAvailable(worker); });
        });
      }).catch(() => { /* PWA is optional. */ });
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { setCopied(false); }, [shareRows]);
  useEffect(() => { setVisibleCount(20); }, [category, zone, query, sort, localOnly, groupOnly, customerAge, customerGender, savedOnly, sharedOnly]);
  const restaurants = data?.restaurants ?? [];
  const filtered = useMemo(() => filterRestaurants(data?.restaurants ?? [], { category, zone, query, sort, localOnly, groupOnly, customerAge, customerGender })
    .filter(r => (!savedOnly || saved.includes(r.id)) && (!sharedOnly || sharedIds.includes(r.id))), [data, category, zone, query, sort, localOnly, groupOnly, customerAge, customerGender, savedOnly, saved, sharedOnly, sharedIds]);
  const recommended = useMemo(() => [...filtered].sort(compareRecommended)[0], [filtered]);
  const missingShared = sharedIds.filter(id => !restaurants.some(r => r.id === id));
  const savedRows = restaurants.filter(r => saved.includes(r.id));
  function toggleSave(r: Restaurant) {
    const removing = saved.includes(r.id);
    if (!removing && saved.length >= 50) return toast('맛집은 최대 50곳까지 담을 수 있어요.');
    const next = removing ? saved.filter(id => id !== r.id) : [...saved, r.id];
    setSaved(next);
    try { localStorage.setItem('bangbang-saved', JSON.stringify(next)); }
    catch { toast('이 브라우저에서는 저장이 제한되어 이번 방문 동안만 담아둘게요.'); }
  }
  function reset() { setQuery(''); setSearchInput(''); setCategory('all'); setZone('all'); setLocalOnly(false); setSavedOnly(false); setSharedOnly(false); setGroupOnly(false); setCustomerAge('all'); setCustomerGender('all'); setSort('recommended'); }
  function openSaved() { setSavedOnly(!savedOnly); setSharedOnly(false); setCategory('all'); setZone('all'); setQuery(''); setSearchInput(''); setLocalOnly(false); setGroupOnly(false); setCustomerAge('all'); setCustomerGender('all'); setMobileTab('list'); }
  function draw() {
    if (!filtered.length) return toast('먼저 음식점 후보를 찾아주세요.');
    const random = new Uint32Array(1); crypto.getRandomValues(random);
    setSelected(filtered[random[0] % filtered.length]);
  }
  async function share(kind: 'native' | 'kakao' | 'copy') {
    if (shareBusy) return;
    const content = sharedContent(shareRows);
    setShareBusy(true);
    try {
      if (kind === 'copy') { await navigator.clipboard.writeText(content.url); setCopied(true); }
      else if (kind === 'native') await navigator.share(content);
      else await kakaoShare(shareRows);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast(kind === 'copy' ? '아래 링크를 길게 눌러 직접 복사해 주세요.' : '공유 창을 열지 못했어요. 링크를 복사해 보내주세요.');
    } finally { setShareBusy(false); }
  }
  async function install() {
    if (installEvent) { await installEvent.prompt(); await installEvent.userChoice; setInstallEvent(null); }
    else setInstallOpen(true);
  }
  const distance = (r: Restaurant) => r.distance >= 1000 ? `${(r.distance / 1000).toFixed(1)}km` : `${r.distance}m`;
  return <>
    <a href="#results" className="skip-link">음식점 목록으로 건너뛰기</a>
    <header className="site-header">
      <a href="/" className="brand" aria-label="뱅뱅밥 홈"><Mascot size={47}/><span>뱅뱅밥<small>우리 동네 한 끼 지도</small></span><span className="beta">BETA</span></a>
      <nav className="header-nav" aria-label="주 메뉴">
        <button className={savedOnly ? 'active' : ''} onClick={openSaved}><Bookmark size={17}/> 담은 맛집 <span className="count-pill">{saved.length}</span></button>
        <button onClick={() => setInfoOpen(true)} aria-label="이용 안내"><Info size={17}/><span className="desktop-text">이용 안내</span></button>
        <button className="install-button" onClick={install}><Smartphone size={16}/><span>홈 화면에 쏙</span></button>
      </nav>
    </header>
    <main className="page-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><span className="eyebrow"><span/> 강남역부터 양재역까지, 맛있는 산책</span><h1 id="hero-title">오늘 점심,<br className="mobile-break"/> <span>뱅뱅 돌지 말고.</span></h1><p>뱅뱅사거리 주변에서 발견하는 맛있는 한 끼.<br className="mobile-break"/> 마음에 드는 곳을 담고, 같이 먹을 사람에게 보내요.</p></div>
        <div className="hero-art" aria-hidden="true"><span className="doodle-star">✦</span><span className="doodle-text">밥 먹으러 가요!</span><div className="mascot-sticker"><Mascot size={115}/></div><span className="food-sticker">🍙</span><span className="small-flower">✿</span></div>
      </section>
      <section className="search-section" aria-label="맛집 검색과 필터">
        <div className="random-discovery">
          <div className="random-intro"><span className="random-eyebrow">점메추가 필요할 때 ✦</span><h2>고민은 그만, 오늘은 여기!</h2><p id="random-hint" role="status">{loading ? '동네 맛집을 불러오고 있어요. 잠시만 기다려 주세요.' : !filtered.length ? '조건에 맞는 후보가 없어요. 검색어나 필터를 바꿔보세요.' : `현재 검색·필터에 맞는 ${filtered.length}곳 중 무작위로 한 집을 골라드려요.`}</p></div>
          <button className="random-button" aria-describedby="random-hint" onClick={draw} disabled={loading || !filtered.length} aria-busy={loading}>{loading ? <RefreshCw size={21} className="spin"/> : <Shuffle size={23}/>}<span className="random-label">{loading ? '맛집 불러오는 중…' : '오늘의 한 집 뽑기'}</span><ArrowRight size={20}/></button>
        </div>
        <form className="search-row" role="search" onSubmit={e => { e.preventDefault(); setQuery(searchInput.trim()); setMobileTab('list'); }}><label className="search-box"><Search size={21}/><span className="sr-only">음식점 이름, 메뉴 종류 또는 주소 검색</span><input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="가게 이름, 음식 종류로 검색" type="search" enterKeyHint="search"/>{searchInput && <button type="button" aria-label="검색어 지우기" onClick={() => { setSearchInput(''); setQuery(''); }}><X size={17}/></button>}</label><button type="submit" className="search-submit">검색</button></form>
        <div className="category-row" aria-label="음식 종류">{CATEGORIES.map(c => <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={`category-chip ${category === c.id ? 'selected' : ''}`}><span>{c.emoji}</span>{c.label}</button>)}</div>
      </section>
      {sharedOnly && <div className="shared-banner"><span>💌 함께 고른 맛집 {sharedIds.length}곳이 도착했어요!</span><button onClick={() => setSharedOnly(false)}>동네 전체 보기 <ArrowRight size={15}/></button></div>}
      {sharedOnly && !loading && missingShared.length > 0 && <p className="inline-notice">공유된 후보 중 {missingShared.length}곳은 현재 검색 결과에서 찾지 못했어요. 다른 후보를 둘러보세요.</p>}
      {data?.partial && <p className="inline-notice">일부 음식점 정보를 가져오지 못했어요. 현재 확인된 후보부터 보여드려요.</p>}
      {updateAvailable && <div className="shared-banner"><span>새로운 뱅뱅밥이 준비됐어요.</span><button onClick={() => { navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); updateAvailable.postMessage({ type: 'SKIP_WAITING' }); }}>업데이트하기</button></div>}
      <section className="explore" aria-label="맛집 탐색">
        <div className="explore-toolbar"><div className="zone-tabs" aria-label="동네 선택">{zones.map(z => <button key={z.id} aria-pressed={zone === z.id} className={zone === z.id ? 'active' : ''} onClick={() => setZone(z.id)}>{z.label}</button>)}</div><div className="discovery-filters"><button className={`local-toggle ${localOnly ? 'active' : ''}`} aria-pressed={localOnly} onClick={() => setLocalOnly(!localOnly)}><Heart size={15}/> 동네 단골 많은 곳</button><button className={`local-toggle group-toggle ${groupOnly ? 'active' : ''}`} aria-pressed={groupOnly} onClick={() => setGroupOnly(!groupOnly)}><UsersRound size={15}/> 회식 후보</button><RecommendationHelp/></div></div>
        {groupOnly && <p className="filter-explanation">저녁 시간대 단체 결제 이력이 있는 곳이에요. 좌석·예약 가능 여부는 매장에 확인해 주세요.</p>}
        <CustomerFilter age={customerAge} gender={customerGender} onAge={setCustomerAge} onGender={setCustomerGender}/>
        <div className="mobile-view-switch"><button aria-pressed={mobileTab === 'list'} onClick={() => setMobileTab('list')}><List size={16}/>목록으로</button><button aria-pressed={mobileTab === 'map'} onClick={() => setMobileTab('map')}><MapIcon size={16}/>지도로</button></div>
        <div className={`explore-grid mobile-${mobileTab}`}>
          <div className="results-panel" id="results" tabIndex={-1}>
            <div className="results-heading"><h2>{savedOnly ? '담아둔 맛집' : sharedOnly ? '함께 고른 맛집' : '오늘의 맛집 후보'} <span>{loading && !data ? '…' : filtered.length}</span></h2><div className="result-actions"><button className="icon-button" aria-label="음식점 새로고침" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/></button><label className="sort-select"><ArrowDownUp size={13}/><span className="sr-only">정렬</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">뱅뱅 추천순</option><option value="distance">사거리 가까운 순</option><option value="rank">지역 매출 상위순</option></select><ChevronDown size={12}/></label></div></div>
            <p className="results-caption">{sort === 'recommended' ? '가까움 + 지역 매출 순위 + 동네 단골을 함께 살폈어요.' : '거리 기준은 뱅뱅사거리에서의 직선거리예요.'}</p>
            {savedOnly && savedRows.length > 0 && <button className="saved-share" onClick={() => setShareRows(savedRows.slice(0, 5))}><Share2 size={15}/> 담은 맛집 함께 공유하기 {savedRows.length > 5 && '(앞의 5곳)'}</button>}
            <div className="results-list" aria-busy={loading}>
              {loading && !data ? <div className="loading-state"><Mascot size={85}/><h3>맛있는 한 끼를 찾고 있어요</h3><p>동네 음식점 정보를 확인하는 중이에요.</p><span className="loading-dots">● ● ●</span></div> : error ? <div className="empty-state"><Mascot size={80} happy={false}/><h3>잠깐, 연결이 쉬어가고 있어요</h3><p>{error}</p><button className="primary-button" onClick={() => void refresh()}>다시 불러오기</button></div> : filtered.length === 0 ? <div className="empty-state"><Mascot size={80} happy={false}/><h3>{savedOnly ? '마음에 드는 곳을 담아보세요' : '이 조건의 맛집은 아직 없어요'}</h3><p>{savedOnly ? '카드의 책갈피를 누르면 이곳에 모여요. 저장한 곳도 현재 조회 결과에 있어야 표시돼요.' : '지역이나 음식 종류를 바꿔 찾아볼까요?'}</p><button className="primary-button" onClick={reset}>동네 맛집 둘러보기</button></div> : filtered.slice(0, visibleCount).map(r => <article key={r.id} className={`restaurant-card ${selected?.id === r.id ? 'card-selected' : ''}`}>
                <button className={`food-art food-art-${r.category}`} onClick={() => setSelected(r)} aria-label={`${r.name} 상세 보기`}><span>{categoryInfo(r.category).emoji}</span><small>{r.genre}</small></button>
                <div className="card-main"><div className="card-top"><span className="card-area">{zones.find(z => z.id === r.zone)?.label} · {distance(r)}</span><button className={`save-button ${saved.includes(r.id) ? 'is-saved' : ''}`} aria-label={`${r.name} ${saved.includes(r.id) ? '담기 해제' : '담기'}`} aria-pressed={saved.includes(r.id)} onClick={() => toggleSave(r)}><Bookmark size={18} fill={saved.includes(r.id) ? 'currentColor' : 'none'}/></button></div><button className="restaurant-name" onClick={() => setSelected(r)}>{r.name}<ChevronRight size={15}/></button><div className="card-badges">{r.localFavorite && <span className="badge-green">🌱 동네 단골</span>}{r.localRank !== null && <span className="badge-peach">지역 상위 {r.localRank}%</span>}{r.groupDining && <span className="badge-purple">회식 후보</span>}</div><RecommendationReasons restaurant={r}/><BusySummary restaurant={r}/><CustomerMatch groups={r.customerGroups} age={customerAge} gender={customerGender}/><div className="card-bottom"><span>{r.genre}</span><button onClick={() => setShareRows([r])} aria-label={`${r.name} 공유`}><Share2 size={13}/> 공유</button><a href={r.eatplUrl} target="_blank" rel="noopener" referrerPolicy="strict-origin-when-cross-origin" aria-label={`${r.name} 잇플 상세 새 창으로 보기`}>잇플 상세 <ExternalLink size={12}/></a></div></div>
              </article>)}
              {!error && filtered.length > visibleCount && <button className="load-more" onClick={() => setVisibleCount(count => count + 20)}>맛집 더 보기 <ChevronDown size={16}/><span>{visibleCount} / {filtered.length}</span></button>}
            </div>
            <div className="data-note"><span>🌾</span><p>eat.pl 잇플 · BC카드 결제 데이터 기반<br/><small>최근 1개월 기준 · 매출 백분위는 낮을수록 상위</small></p></div>
          </div>
          <div className="map-panel">{!loading && !error && data && filtered.length === 0 && <div className="map-empty-state" role="status"><p>이 조건에 맞는 맛집은 아직 없어요.<br/>고객층이나 다른 필터를 바꿔볼까요?</p><button className="secondary-button" onClick={reset}>필터 모두 초기화</button></div>}{!loading && !error && <RecommendedPick restaurant={recommended} onSelect={setSelected}/>}<MapView restaurants={filtered} selected={selected} zone={zone} onSelect={setSelected} onNotice={toast}/><div className="map-footer"><span><i/> 강남역 1·8번 ↔ 양재역 1·4번 출구 사이</span><button onClick={() => setInfoOpen(true)}>범위 안내 <Info size={13}/></button></div></div>
        </div>
      </section>
      <section className="bottom-note"><span>한 끼의 고민은 작게, 맛있는 발견은 크게.</span><span>우리 동네에서 잘 먹고, 잘 지내요 <span aria-hidden="true">☘</span></span></section>
      {children}
      <footer className="site-footer"><span>뱅뱅밥 · 같이 만드는 동네 지도</span><div><a href="/guide">지역·추천 안내</a><a href="https://github.com/BongwooChoi/bangbang" target="_blank" rel="noopener noreferrer">GitHub에서 함께 만들기 <ExternalLink size={12}/></a><button onClick={() => setInfoOpen(true)}>데이터·이용 안내</button></div></footer>
    </main>
    {selected && <Dialog title="오늘의 한 끼 후보" onClose={() => setSelected(null)}><div className={`detail-art food-art-${selected.category}`}><span>{categoryInfo(selected.category).emoji}</span><span className="detail-art-note">맛있는 발견!</span></div><div className="detail-title"><div><span className="card-area">{selected.genre} · 사거리에서 직선 {distance(selected)}</span><h3>{selected.name}</h3></div><button className={`save-button ${saved.includes(selected.id) ? 'is-saved' : ''}`} onClick={() => toggleSave(selected)} aria-label={`${selected.name} ${saved.includes(selected.id) ? '담기 해제' : '담기'}`} aria-pressed={saved.includes(selected.id)}><Bookmark fill={saved.includes(selected.id) ? 'currentColor' : 'none'}/></button></div><p className="detail-address">{selected.address}</p><RecommendationReasons restaurant={selected}/><div className="detail-next-step"><a className="primary-button" href={selected.eatplUrl} target="_blank" rel="noopener" referrerPolicy="strict-origin-when-cross-origin" aria-describedby="eatpl-destination">이 집 더 알아보기 <ExternalLink size={17}/></a><p id="eatpl-destination">잇플에서 매장 상세 페이지를 열어요.</p></div><div className="rank-grid"><div><small>전국 동일 업종 매출</small><strong>{selected.nationalRank === null ? '미확인' : `상위 ${selected.nationalRank}%`}</strong></div><div><small>시·군·구 동일 업종 매출</small><strong>{selected.localRank === null ? '미확인' : `상위 ${selected.localRank}%`}</strong></div></div><dl className="detail-facts"><div><dt>영업 예상 시간</dt><dd>{selected.hours || '미확인'}</dd></div>{selected.localFavorite && <div><dt>동네 단골</dt><dd>동네 고객 비율이 지역 평균보다 높아요</dd></div>}{selected.groupDining && <div><dt>회식 후보</dt><dd>저녁 단체 결제 이력이 있어요</dd></div>}</dl><BusyDetails restaurant={selected}/><CustomerDetails groups={selected.customerGroups}/><p className="fine-print">최근 1개월 결제 데이터에 따른 추정이에요. 공식 영업시간·실시간 대기 정보가 아니며, 현재 영업 현황은 잇플에서 확인해 주세요.</p><div className="detail-buttons"><button className="secondary-button" onClick={() => { setShareRows([selected]); setSelected(null); }}><Share2 size={17}/> 같이 먹자고 공유</button></div></Dialog>}
    {shareRows.length > 0 && <Dialog title="맛있는 건 같이 나눠요" onClose={() => setShareRows([])}><div className="share-illustration">💌</div><p className="share-intro">{shareRows.map(r => r.name).join(', ')}<br/><span>같이 먹을 사람에게 보내볼까요?</span></p><div className="share-options">{(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || nativeShare) && <button className="kakao-button" disabled={shareBusy} onClick={() => void share('kakao')}><MessageCircle size={22}/><strong>카카오톡으로 공유</strong>{!process.env.NEXT_PUBLIC_KAKAO_JS_KEY && <small>기기 공유 창에서 카카오톡 선택</small>}</button>}{nativeShare && <button disabled={shareBusy} onClick={() => void share('native')}><Share2 size={21}/><strong>다른 앱으로 공유</strong><small>메시지, SNS 등</small></button>}<button disabled={shareBusy} onClick={() => void share('copy')}>{copied ? <Check size={22}/> : <Copy size={22}/>}<strong>{copied ? '링크를 복사했어요' : '링크 복사'}</strong><small>어디든 붙여넣어 보내요</small></button></div>{!nativeShare && !process.env.NEXT_PUBLIC_KAKAO_JS_KEY && <p className="fine-print">링크를 복사해 카카오톡이나 원하는 SNS에 붙여넣어 주세요.</p>}{mounted && <label className="share-link-label">공유 링크<input aria-label="복사할 공유 링크" readOnly value={sharedContent(shareRows).url} onFocus={e => e.target.select()}/></label>}</Dialog>}
    {infoOpen && <Dialog title="뱅뱅밥을 소개해요" onClose={() => setInfoOpen(false)}><div className="info-mascot"><Mascot size={80}/><p>우리 동네 점심 고민을<br/><strong>조금 더 가볍게.</strong></p></div><div className="info-block"><h3>어디까지 보여주나요?</h3><p>강남역 1·8번 출구와 양재역 1·4번 출구를 잇는 경계 사이, 강남대로 중심선 양쪽 약 400m의 음식점을 찾아요. 뱅뱅사거리가 지도 중심이에요.</p></div><div className="info-block"><h3>어떤 맛집인가요?</h3><p>eat.pl 잇플의 최근 1개월 BC카드 결제 데이터를 활용해요. 매출 순위는 맛이나 별점 순위와 달라요. 조회 가능한 후보를 모아 보여드리며 모든 음식점을 포함하지는 않아요. 업종은 제공된 분류를 따르므로 실제 매장과 다를 수 있어요.</p></div><div className="info-block"><h3>저장과 개인정보</h3><p>담은 맛집의 식별자만 이 브라우저에 저장해요. 위치는 내 위치 버튼을 눌렀을 때 지도 표시에만 사용하며 서버로 보내지 않아요. 지도 표시에는 OpenStreetMap, 맛집 조회에는 k-skill의 잇플 연동을 이용해요.</p></div><div className="info-block"><h3>함께 만드는 지도</h3><p>잘못된 표시나 좋은 아이디어가 있나요? <a href="https://github.com/BongwooChoi/bangbang/issues" target="_blank" rel="noopener noreferrer">GitHub에 의견을 남겨주세요.</a> 이 프로젝트는 BC카드의 공식 서비스가 아니에요.</p></div>{data && <p className="fine-print">마지막 조회: {mounted ? new Date(data.fetchedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : data.fetchedAt.slice(0, 10)} · 실제 방문 전 매장 정보를 확인해 주세요.</p>}</Dialog>}
    {installOpen && <Dialog title="홈 화면에 쏙, 뱅뱅밥" onClose={() => setInstallOpen(false)}><div className="info-mascot"><Mascot size={85}/><p>점심시간마다<br/>한 번에 만나요.</p></div><ol className="install-steps"><li><strong>iPhone·iPad</strong><p>브라우저의 공유 메뉴에서 ‘홈 화면에 추가’를 선택해 주세요.</p></li><li><strong>Android</strong><p>Chrome·Samsung Internet 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해 주세요.</p></li></ol><p className="fine-print">카카오톡 안에서 열었다면 먼저 외부 브라우저로 열어주세요. 설치 없이도 모든 맛집을 둘러볼 수 있어요. 설치 메뉴는 기기와 브라우저에 따라 다를 수 있어요.</p></Dialog>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="알림 닫기"><X size={16}/></button></div>}
  </>;
}
