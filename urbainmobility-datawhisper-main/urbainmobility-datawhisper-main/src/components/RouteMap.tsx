import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";

// Fix default marker icons (Leaflet expects assets we don't ship)
const icon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:hsl(var(--primary, 220 90% 56%));box-shadow:0 0 0 3px white,0 0 0 4px hsl(var(--primary, 220 90% 56%));"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export type MapStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  line?: string;
};

const LINE_COLORS: Record<string, string> = {
  "1": "#FFCD00",
  "4": "#C04191",
  "14": "#62259D",
  "RER A": "#E2231A",
  "RER B": "#3C91DC",
  "RER C": "#F3A4BA",
};

function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lon]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [stops, map]);
  return null;
}

export function RouteMap({ stops }: { stops: MapStop[] }) {
  const center: [number, number] = stops.length
    ? [stops[0].lat, stops[0].lon]
    : [48.8566, 2.3522];

  const segments = useMemo(() => {
    const segs: { positions: [number, number][]; color: string; line?: string }[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      const line = b.line;
      segs.push({
        positions: [
          [a.lat, a.lon],
          [b.lat, b.lon],
        ],
        color: (line && LINE_COLORS[line]) || "#3b82f6",
        line,
      });
    }
    return segs;
  }, [stops]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "1rem", background: "#0b1220" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg.positions} pathOptions={{ color: seg.color, weight: 6, opacity: 0.9 }} />
      ))}
      {stops.map((s, i) => {
        const isEndpoint = i === 0 || i === stops.length - 1;
        return isEndpoint ? (
          <Marker key={s.id} position={[s.lat, s.lon]} icon={icon}>
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {i === 0 ? "Départ" : "Arrivée"}
            </Popup>
          </Marker>
        ) : (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lon]}
            radius={5}
            pathOptions={{ color: "#fff", fillColor: (s.line && LINE_COLORS[s.line]) || "#3b82f6", fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <strong>{s.name}</strong>
              {s.line && <div>Ligne {s.line}</div>}
            </Popup>
          </CircleMarker>
        );
      })}
      <FitBounds stops={stops} />
    </MapContainer>
  );
}

export default RouteMap;
