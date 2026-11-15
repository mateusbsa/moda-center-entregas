import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { MODA_CENTER } from "@/lib/route";

export type PontoMapa = { key: string; n: number; lat: number; lng: number; alvo: boolean; alerta: boolean; label: string };

/** Browser-only map: Leaflet is imported inside the effect so SSR never loads it. */
export function RouteMap({ me, pontos }: { me: [number, number] | null; pontos: PontoMapa[] }) {
  const el = useRef<HTMLDivElement>(null);
  const st = useRef<{ L: typeof Leaflet; map: Leaflet.Map; layer: Leaflet.LayerGroup } | null>(null);
  const centrado = useRef(false);

  useEffect(() => {
    let cancel = false;
    import("leaflet").then((mod) => {
      const L = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      if (cancel || !el.current || st.current) return;
      const map = L.map(el.current, { zoomControl: false }).setView(MODA_CENTER, 18);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
      st.current = { L, map, layer: L.layerGroup().addTo(map) };
      desenhar();
    });
    return () => { cancel = true; st.current?.map.remove(); st.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function desenhar() {
    const s = st.current;
    if (!s) return;
    const { L, layer, map } = s;
    layer.clearLayers();
    for (const p of pontos) {
      const cls = `map-pin${p.alvo ? " map-pin-alvo" : ""}${p.alerta ? " map-pin-alerta" : ""}`;
      L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="${cls}">${p.n}</div>`, iconSize: [42, 42], iconAnchor: [21, 21] }) })
        .bindTooltip(p.label).addTo(layer);
    }
    const alvo = pontos.find((p) => p.alvo);
    if (me) {
      L.marker(me, { icon: L.divIcon({ className: "", html: '<div class="map-me"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }) }).addTo(layer);
      if (alvo) L.polyline([me, [alvo.lat, alvo.lng]], { color: getComputedStyle(document.documentElement).getPropertyValue("--foreground"), weight: 5, dashArray: "10 8" }).addTo(layer);
    }
    if (!centrado.current && (me || alvo)) {
      centrado.current = true;
      const pts: [number, number][] = [...(me ? [me] : []), ...(alvo ? [[alvo.lat, alvo.lng] as [number, number]] : [])];
      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 19 });
      else map.setView(pts[0]!, 18);
    }
  }

  useEffect(desenhar, [me, pontos]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="h-full w-full" aria-label="Mapa da rota" />;
}
