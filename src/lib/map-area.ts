import L from 'leaflet';
import { CORRIDOR_POLYGON, STATIONS, STATION_RADIUS_METERS } from './geo';

export const SEARCH_AREA_BOUNDS = L.latLngBounds(CORRIDOR_POLYGON);
for (const station of Object.values(STATIONS)) {
  SEARCH_AREA_BOUNDS.extend(L.latLng(station).toBounds(2 * STATION_RADIUS_METERS));
}

export function drawSearchArea(map: L.Map, style: L.PathOptions) {
  L.polygon(CORRIDOR_POLYGON, style).addTo(map);
  for (const station of Object.values(STATIONS)) {
    L.circle(station, { ...style, radius: STATION_RADIUS_METERS }).addTo(map);
  }
}
