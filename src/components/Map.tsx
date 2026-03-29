'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { forwardGeocodeUrl, reverseGeocodeUrl } from '@/lib/mapboxGeocoding';

interface MapProps {
  threatBuildings?: Record<string, 'advisory' | 'warning' | 'critical'>;
  is3D?: boolean;
  center?: [number, number];
  onMapClick?: (lng: number, lat: number) => void;
  onBuildingClick?: (lng: number, lat: number, buildingId: string) => void;
}

declare global {
  interface Window {
    mapboxgl: typeof import('mapbox-gl');
  }
}

export default function Map({ threatBuildings, is3D, center, onMapClick, onBuildingClick }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxglRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const centerRef = useRef<{ lng: number; lat: number }>({ lng: -98.5795, lat: 39.8283 });

  const syncCenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    centerRef.current = { lng: c.lng, lat: c.lat };
  }, []);

  // Store callback refs to avoid re-running the init effect when callbacks change
  const onMapClickRef = useRef(onMapClick);
  const onBuildingClickRef = useRef(onBuildingClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onBuildingClickRef.current = onBuildingClick; }, [onBuildingClick]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    let cancelled = false;

    import('mapbox-gl').then((mapboxgl) => {
      if (cancelled || !mapContainerRef.current) return;

      mapboxglRef.current = mapboxgl.default;
      mapboxgl.default.accessToken = token;

      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-98.5795, 39.8283],
        zoom: 3.5,
        antialias: true,
      });
      mapRef.current = map;

      if (cancelled) {
        map.remove();
        mapRef.current = null;
        return;
      }

      map.on('moveend', syncCenter);

      map.on('load', () => {
        if (cancelled) return;
        setMapLoaded(true);
        syncCenter();

        // 3D buildings layer
        const layers = map.getStyle().layers;
        let labelLayerId: string | undefined;
        if (layers) {
          for (const layer of layers) {
            if (layer.type === 'symbol' && (layer.layout as any)?.['text-field']) {
              labelLayerId = layer.id;
              break;
            }
          }
        }

        map.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'threatLevel'], false],
                '#ef4444',
                '#1a2535',
              ],
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'height']],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'min_height']],
              'fill-extrusion-opacity': 0.7,
            },
          },
          labelLayerId,
        );

        // Click handler — building or map
        map.on('click', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['3d-buildings'] });
          if (features.length > 0 && onBuildingClickRef.current) {
            const f = features[0];
            const buildingId = String(f.id ?? f.properties?.id ?? Math.random());
            onBuildingClickRef.current(e.lngLat.lng, e.lngLat.lat, buildingId);
          } else if (onMapClickRef.current) {
            onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
          }
        });

        // Change cursor on building hover
        map.on('mouseenter', '3d-buildings', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', '3d-buildings', () => { map.getCanvas().style.cursor = ''; });
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [syncCenter]);

  // React to is3D prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.easeTo({ pitch: is3D ? 45 : 0, bearing: is3D ? -17.6 : 0, duration: 800 });
  }, [is3D, mapLoaded]);

  // React to center prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !center) return;
    map.flyTo({ center, zoom: 14, duration: 1000 });
  }, [center, mapLoaded]);

  // React to threatBuildings changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !threatBuildings) return;
    if (!map.getLayer('3d-buildings')) return;
    Object.entries(threatBuildings).forEach(([buildingId, level]) => {
      try {
        map.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: buildingId },
          { threatLevel: level },
        );
      } catch {
        // Feature ID may not be available — skip gracefully
      }
    });
  }, [threatBuildings, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Tactical overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,14,23,0.15) 0%, transparent 15%, transparent 85%, rgba(10,14,23,0.3) 100%)',
        }}
      />
    </div>
  );
}
