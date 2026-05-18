import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
  interactive?: boolean;
  className?: string;
};

export function MapLibreLocation({
  latitude,
  longitude,
  label = "Spacio location",
  interactive = true,
  className = "h-56 w-full",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function mountMap() {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const center: [number, number] = [longitude, latitude];
      if (!mapRef.current) {
        mapRef.current = new maplibregl.Map({
          container: containerRef.current,
          center,
          zoom: 15,
          interactive,
          attributionControl: false,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "OpenStreetMap contributors",
              },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
          },
        });
        mapRef.current.addControl(new maplibregl.AttributionControl({ compact: true }));
        markerRef.current = new maplibregl.Marker({ color: "#1E40AF" })
          .setLngLat(center)
          .setPopup(new maplibregl.Popup({ offset: 18 }).setText(label))
          .addTo(mapRef.current);
      } else {
        mapRef.current.setCenter(center);
        markerRef.current?.setLngLat(center);
      }
    }

    mountMap();
    return () => {
      cancelled = true;
    };
  }, [interactive, label, latitude, longitude]);

  return <div ref={containerRef} className={className} />;
}
