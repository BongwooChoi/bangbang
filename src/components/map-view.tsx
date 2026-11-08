'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Plus, Minus, MapPin } from 'lucide-react';
import { AREA_POLYGON, CENTER, EXITS, isInArea, type Point, type Zone } from '@/lib/geo';
import { categoryInfo, type Restaurant } from '@/lib/restaurants';

type Props = { restaurants: Restaurant[]; selected: Restaurant | null; zone: Zone; onSelect: (r: Restaurant) => void; onNotice: (message: string) => void };
function moveTo(instance: L.Map | null, p: Point, zoom: number) {
  if (!instance) return;
  instance.stop();
  const element = instance.getContainer();
  // Mobile list mode hides the map. Leaflet flyTo divides by its viewport size;
  // a zero-sized viewport produces NaN coordinates and crashes the React tree.
  if (!element.clientWidth || !element.clientHeight) {
    instance.setView([p.lat, p.lng], zoom, { animate: false });
  } else {
    instance.flyTo([p.lat, p.lng], zoom, { duration: 0.4 });
  }
}
export default function MapView({ restaurants, selected, zone, onSelect, onNotice }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const locationMarker = useRef<L.CircleMarker | null>(null);
  const select = useRef(onSelect); select.current = onSelect;
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { zoomControl: false, attributionControl: true, minZoom: 14, maxZoom: 19, scrollWheelZoom: true }).setView([CENTER.lat, CENTER.lng], 16);
    map.current = instance;
    L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19, keepBuffer: 1,
    }).on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(instance);
    L.polygon(AREA_POLYGON.map(p => [p.lat, p.lng] as [number, number]), { color: '#71997c', weight: 2, dashArray: '6 7', fillColor: '#c6ddba', fillOpacity: 0.1, interactive: false }).addTo(instance);
    const addLabel = (p: Point, label: string, main = false) => {
      const el = document.createElement('div'); el.className = `landmark-label ${main ? 'main-landmark' : ''}`; el.textContent = label;
      L.marker([p.lat, p.lng], { icon: L.divIcon({ html: el, className: 'landmark-container', iconSize: [120, 30], iconAnchor: [60, 15] }), interactive: false, zIndexOffset: -500 }).addTo(instance);
    };
    addLabel(CENTER, '✦ 뱅뱅사거리', true);
    addLabel(EXITS.gangnam8, '강남역 1·8번'); addLabel(EXITS.yangjae1, '양재역 1·4번');
    markers.current = L.layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => {
      if (!container.current?.clientWidth || !container.current.clientHeight) instance.stop();
      instance.invalidateSize({ animate: false });
    }); observer.observe(container.current);
    setReady(true);
    return () => { observer.disconnect(); instance.remove(); map.current = null; markers.current = null; };
  }, []);
  useEffect(() => {
    if (!markers.current || !ready) return;
    markers.current.clearLayers();
    restaurants.forEach(r => {
      const el = document.createElement('div');
      el.className = `food-marker ${selected?.id === r.id ? 'is-selected' : ''} marker-${r.category}`;
      el.textContent = categoryInfo(r.category).emoji;
      const marker = L.marker([r.lat, r.lng], { icon: L.divIcon({ html: el, className: 'food-marker-wrap', iconSize: [36, 42], iconAnchor: [18, 39] }), title: r.name, alt: r.name, keyboard: true, zIndexOffset: selected?.id === r.id ? 1000 : 0 });
      const tooltip = document.createElement('span'); tooltip.textContent = r.name;
      marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -33], className: 'food-tooltip' });
      marker.on('click', () => select.current(r)); marker.addTo(markers.current!);
      marker.getElement()?.setAttribute('aria-label', `${r.name} 상세 보기`);
    });
  }, [restaurants, selected?.id, ready]);
  useEffect(() => { if (selected) moveTo(map.current, selected, 17); }, [selected]);
  useEffect(() => {
    const centers = { all: CENTER, bangbang: CENTER, gangnam: { lat: 37.4956, lng: 127.0288 }, yangjae: { lat: 37.4864, lng: 127.033 } };
    moveTo(map.current, centers[zone], 16);
  }, [zone]);
  function locate() {
    if (!navigator.geolocation) return onNotice('이 브라우저에서는 위치를 확인할 수 없어요.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocating(false); const p = { lat: coords.latitude, lng: coords.longitude };
      if (!isInArea(p)) return onNotice('지금 위치는 탐색 범위 밖이에요. 뱅뱅사거리 주변을 둘러보세요.');
      if (!map.current) return;
      locationMarker.current?.remove();
      locationMarker.current = L.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#4d83da', fillOpacity: 1 }).addTo(map.current);
      moveTo(map.current, p, 17);
    }, () => { setLocating(false); onNotice('위치 권한을 확인해 주세요. 위치 없이도 지도를 볼 수 있어요.'); }, { timeout: 8000, maximumAge: 60000 });
  }
  return <div className="map-wrapper">
    <div ref={container} className="leaflet-map" role="region" aria-label="뱅뱅사거리 음식점 지도"/>
    <div className="map-label"><span className="live-dot"/> 우리 동네 맛집 지도 <span className="map-label-small">강남 ↔ 양재</span></div>
    <div className="map-buttons">
      <button onClick={() => map.current?.zoomIn()} aria-label="지도 확대"><Plus size={20}/></button>
      <button onClick={() => map.current?.zoomOut()} aria-label="지도 축소"><Minus size={20}/></button>
      <span/>
      <button onClick={() => moveTo(map.current, CENTER, 16)} aria-label="뱅뱅사거리로 이동"><MapPin size={19}/></button>
      <button onClick={locate} disabled={locating} aria-label="내 위치로 이동"><LocateFixed className={locating ? 'spin' : ''} size={19}/></button>
    </div>
    <div className="map-note">점선 안에서 오늘의 한 끼를 찾아요 🌱</div>
    {tileError && <div className="map-error" role="status">지도를 불러오지 못했어요. 음식점 목록은 계속 이용할 수 있어요.</div>}
  </div>;
}
