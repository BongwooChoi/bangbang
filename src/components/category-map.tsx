'use client';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, ArrowRight, List, Minus, Plus, RotateCcw, Shuffle, X } from 'lucide-react';
import { AREA_POLYGON, CENTER, type Zone } from '@/lib/geo';
import { CATEGORIES, categoryInfo, type Category, type Restaurant } from '@/lib/restaurants';
import { clusterMapPoints, type MapCluster } from '@/lib/map-clusters';

const WIDTH = 700, HEIGHT = 640;
type Props = { category: Category; restaurants: Restaurant[]; selected: Restaurant | null; busy: boolean; error: string; onCategory: (category: Category) => void; onSelect: (restaurant: Restaurant) => void; onBack: () => void; onList: () => void; onDraw: () => void; onRetry: () => void };
export default function CategoryMap({ category, restaurants, selected, busy, error, onCategory, onSelect, onBack, onList, onDraw, onRetry }: Props) {
  const container = useRef<HTMLDivElement>(null), camera = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false), [view, setView] = useState(0), [tileError, setTileError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(.8), [zoom, setZoom] = useState(15);
  const [zone, setZone] = useState<Zone>('all'), [cluster, setCluster] = useState<Restaurant[]>([]);
  const gesture = useRef<{ id: number; x: number; y: number; lastX: number; lastY: number; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, {x:number;y:number}>());
  const pinchDistance = useRef(0);
  const suppressClick = useRef(false);
  const info = categoryInfo(category);
  useEffect(() => {
    if (!container.current) return;
    // Leaflet is the geographic ground plane. Our fixed 2D projection handles gestures;
    // transformed DOM bounds must never be interpreted as Leaflet drag pixels.
    const instance = L.map(container.current, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, zoomAnimation: false, fadeAnimation: false, minZoom: 14, maxZoom: 19 });
    map.current = instance;
    L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, keepBuffer: 1 }).on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(instance);
    L.polygon(AREA_POLYGON.map(p => [p.lat, p.lng] as [number, number]), { color: '#647d61', weight: 2, dashArray: '6 6', fillOpacity: .04, interactive: false }).addTo(instance);
    const changed = () => { setZoom(instance.getZoom()); setView(v => v + 1); };
    instance.on('moveend zoomend', changed);
    instance.fitBounds(AREA_POLYGON.map(p => [p.lat, p.lng] as [number, number]), { padding: [45, 45], animate: false });
    setReady(true);
    return () => { instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!camera.current) return;
    const update = () => setScale(Math.min(.84, Math.max(.25, (camera.current!.clientWidth - 32) / 790)));
    const observer = new ResizeObserver(update); observer.observe(camera.current); update();
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setCluster([]); }, [category]);
  const clusters = useMemo(() => {
    if (!ready || !map.current) return [];
    const points = restaurants.map(restaurant => ({ restaurant, ...map.current!.latLngToContainerPoint([restaurant.lat, restaurant.lng]) })).filter(p => p.x >= 18 && p.x <= WIDTH - 18 && p.y >= 24 && p.y <= HEIGHT - 18);
    return clusterMapPoints(points, 48 / scale);
  }, [restaurants, ready, view, scale]);
  const visibleCount = clusters.reduce((sum, group) => sum + group.restaurants.length, 0);
  function goTo(next: Zone) {
    setZone(next); setCluster([]);
    if (!map.current) return;
    if (next === 'all') map.current.fitBounds(AREA_POLYGON.map(p => [p.lat, p.lng] as [number, number]), { padding: [45, 45], animate: false });
    else {
      const center = next === 'gangnam' ? { lat: 37.4956, lng: 127.0288 } : next === 'yangjae' ? { lat: 37.4864, lng: 127.033 } : CENTER;
      map.current.setView([center.lat, center.lng], 17, { animate: false });
    }
  }
  function openCluster(group: MapCluster) {
    if (group.restaurants.length === 1) { onSelect(group.restaurants[0]); return; }
    setCluster(group.restaurants);
    const instance = map.current;
    if (instance) {
      const previousZoom = instance.getZoom();
      instance.fitBounds(group.restaurants.map(r => [r.lat, r.lng] as [number, number]), { padding: [100, 100], maxZoom: 19, animate: false });
      if (instance.getZoom() <= previousZoom) instance.setZoom(Math.min(19, previousZoom + 1));
    }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId); pinchDistance.current = 0;
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (!pointers.current.size) suppressClick.current = false;
    pointers.current.set(event.pointerId, {x:event.clientX,y:event.clientY});
    if (pointers.current.size > 1) {
      gesture.current = null; suppressClick.current = true; setDragging(false);
      const [a,b] = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(a.x-b.x,a.y-b.y);
      for (const id of pointers.current.keys()) event.currentTarget.setPointerCapture(id);
      return;
    }
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pointers.current.size > 1) {
      const [a,b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x-b.x,a.y-b.y), ratio = distance / pinchDistance.current;
      if (ratio > 1.3 || ratio < .77) {
        const current = map.current;
        if (current) current.setZoom(Math.max(14,Math.min(19,current.getZoom()+(ratio>1?1:-1))));
        pinchDistance.current = distance;
      }
      return;
    }
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (!g.moved) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      g.moved = true; suppressClick.current = true; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId);
    }
    const x = (event.clientX - g.lastX) / scale, y = (event.clientY - g.lastY) / scale;
    // Inverse of the CSS ground matrix(1,-.08,.18,.82,0,0).
    map.current?.panBy([-(.82*x-.18*y)/.8344,-(.08*x+y)/.8344], { animate: false });
    g.lastX = event.clientX; g.lastY = event.clientY;
  }
  return <section className="category-map-chapter" aria-label={`${info.label} 종이 지도`}>
    <header className="geo-heading"><button className="geo-back" onClick={onBack}><ArrowLeft size={17}/>동네로</button><div><span className="book-kicker">POP-UP MAP · 실제 매장 위치</span><h1>{info.emoji} {info.label} 한 장 지도 <small>{restaurants.length}곳</small></h1></div><button className="geo-list" onClick={onList}><List size={17}/><span>목록</span></button></header>
    <div className="geo-categories" aria-label="지도 음식 종류">{CATEGORIES.map(c => <button key={c.id} aria-pressed={category === c.id} onClick={() => onCategory(c.id)}>{c.emoji} {c.label}</button>)}</div>
    <div className="geo-neighborhoods" aria-label="지도 지역">{([{ id:'all',label:'전체 범위' },{ id:'gangnam',label:'강남역' },{ id:'bangbang',label:'뱅뱅사거리' },{ id:'yangjae',label:'양재역' }] as const).map(z => <button key={z.id} aria-pressed={zone === z.id} onClick={() => goTo(z.id)}>{z.label}</button>)}</div>
    <div ref={camera} className={`geo-camera ${dragging ? 'is-dragging' : ''}`} style={{ '--geo-scale':scale } as CSSProperties}
      tabIndex={0} role="group" aria-label="실제 매장 지도. 밀어서 이동하고 두 손가락으로 확대해요. 방향키 이동, Home 키 전체 보기."
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={e => { if (e.target === e.currentTarget) end(e); }} onPointerLeave={e => { if (!gesture.current?.moved && pointers.current.size < 2) { gesture.current = null; pointers.current.delete(e.pointerId); } }}
      onClickCapture={e => { if (suppressClick.current && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); } }}
      onKeyDown={e => {
        if (e.target !== e.currentTarget || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'Home') goTo('all');
        else map.current?.panBy([e.key === 'ArrowLeft' ? -70 : e.key === 'ArrowRight' ? 70 : 0, e.key === 'ArrowUp' ? -70 : e.key === 'ArrowDown' ? 70 : 0], { animate:false });
      }}>
      <div className="geo-plane"><div className="geo-cover"/><div ref={container} className="geo-floor" aria-hidden="true"/>
        <div className="geo-pins">{clusters.map(group => <button key={group.restaurants.map(r => r.id).join(',')} className={`geo-pin ${group.restaurants.length === 1 ? 'is-single' : ''} ${group.restaurants.some(r => r.id === selected?.id) ? 'is-selected' : ''}`} style={{ left:group.x,top:group.y }} onClick={() => openCluster(group)} aria-label={group.restaurants.length === 1 ? `${group.restaurants[0].name} 상세 보기` : `가까운 ${info.label} ${group.restaurants.length}곳 확대`}>
          <span className="geo-pin-label">{group.restaurants.length === 1 ? group.restaurants[0].name : `${group.restaurants.length}곳 모아보기`}</span><span className="geo-pin-face">{group.restaurants.length === 1 ? categoryInfo(group.restaurants[0].category).emoji : group.restaurants.length}</span><span className="geo-pin-foot"/>
        </button>)}</div>
      </div>
      <span className="geo-north" aria-hidden="true">N ↑</span>
      <span className="geo-credit" dangerouslySetInnerHTML={{ __html: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' }}/>
    </div>
    <div className="geo-controls"><span className="geo-pan-label">밀어서 이동 · 두 손가락으로 확대</span><div className="geo-zoom"><button aria-label="지도 축소" disabled={!ready || zoom <= 14} onClick={() => map.current?.zoomOut()}><Minus size={18}/></button><button aria-label="지도 확대" disabled={!ready || zoom >= 19} onClick={() => map.current?.zoomIn()}><Plus size={18}/></button><button aria-label="지도 전체 보기" onClick={() => goTo('all')}><RotateCcw size={16}/></button></div></div>
    <p className="geo-hint" role="status">{busy ? '매장 위치를 펼치고 있어요…' : error ? <>{error} <button onClick={onRetry}>다시 불러오기</button></> : restaurants.length === 0 ? '이 종류의 매장은 현재 조회되지 않아요. 다른 종류를 골라보세요.' : <>지도에 {visibleCount}곳 · 숫자를 누르면 가까운 매장을 골라볼 수 있어요.</>}</p>
    {tileError && <p className="geo-error">배경 지도를 불러오지 못했어요. 매장 위치 핀은 계속 표시됩니다.</p>}
    {cluster.length > 0 && <aside className="geo-cluster-list" aria-label="가까운 매장"><div><strong>가까운 매장 {cluster.length}곳</strong><button onClick={() => setCluster([])} aria-label="가까운 매장 접기"><X size={16}/></button></div><p>같은 건물이나 가까운 위치의 매장을 골라보세요.</p><div className="geo-cluster-options">{cluster.map(r => <button key={r.id} onClick={() => onSelect(r)}>{categoryInfo(r.category).emoji} {r.name}<ArrowRight size={13}/></button>)}</div></aside>}
    <div className="geo-footer"><button className="geo-draw" onClick={onDraw} disabled={busy || !restaurants.length}><Shuffle size={16}/>{info.label}에서 한 집 뽑기</button></div>
  </section>;
}
