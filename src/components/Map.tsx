'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TownModel } from '@/types';
import { forwardGeocodeUrl, reverseGeocodeUrl } from '@/lib/mapboxGeocoding';

interface MapProps {
  townModel: TownModel | null;
  /** Optional lng/lat bias for server geocoding (Mapbox `proximity`) — improves ranking for suggestions / map area. */
  onAddressSelect: (address: string, proximityHint?: { lng: number; lat: number }) => void;
  loading: boolean;
}

const DEMO_ADDRESS = 'Moore, Oklahoma';
/** Approximate center for Moore, OK — used as geocode proximity for the demo button. */
const DEMO_PROXIMITY = { lng: -97.4868, lat: 35.3395 };

declare global {
  interface Window {
    mapboxgl: typeof import('mapbox-gl');
  }
}

export default function Map({ townModel, onAddressSelect, loading }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxglRef = useRef<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const centerRef = useRef<{ lng: number; lat: number }>({ lng: -98.5795, lat: 39.8283 });

  const syncCenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    centerRef.current = { lng: c.lng, lat: c.lat };
  }, []);

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
        center: [-98.5795, 39.8283], // Center of the US
        zoom: 3.5, // Zoomed out to show whole US
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

        map.on('click', async (e) => {
          const { lng, lat } = e.lngLat;
          if (!token || token === 'pk.your_mapbox_token_here') return;

          try {
            const res = await fetch(reverseGeocodeUrl({ accessToken: token, lng, lat, limit: 1 }));
            const json = await res.json();
            if (json.features && json.features.length > 0) {
              const address = json.features[0].place_name;
              setSearchValue(address);
              onAddressSelect(address, { lng, lat });
            }
          } catch (err) {
            console.error('Reverse geocoding failed:', err);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onAddressSelect, syncCenter]);

  // Draw building footprints on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !townModel) return;

    // Remove existing layers
    ['buildings-fill', 'buildings-outline'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('buildings')) map.removeSource('buildings');

    const features = townModel.buildings.map((b) => ({
      type: 'Feature' as const,
      properties: { id: b.id, type: b.type, material: b.material, levels: b.levels },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [b.polygon.map(([lat, lng]) => [lng, lat])],
      },
    }));

    map.addSource('buildings', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    map.addLayer({
      id: 'buildings-fill',
      type: 'fill',
      source: 'buildings',
      paint: {
        'fill-color': [
          'match',
          ['get', 'type'],
          'hospital', '#ef4444',
          'school', '#f97316',
          'commercial', '#ecc94b',
          'industrial', '#8899aa',
          '#4a7fa5',
        ],
        'fill-opacity': 0.55,
      },
    });

    map.addLayer({
      id: 'buildings-outline',
      type: 'line',
      source: 'buildings',
      paint: {
        'line-color': '#22d3ee',
        'line-width': 0.8,
        'line-opacity': 0.6,
      },
    });

    map.flyTo({
      center: [townModel.center.lng, townModel.center.lat],
      zoom: 14,
      duration: 1000,
    });

    // Fit bounds to show all buildings
    if (features.length > 0 && mapboxglRef.current) {
      const bounds = new mapboxglRef.current.LngLatBounds();
      features.forEach((f) => {
        f.geometry.coordinates[0].forEach((coord) => {
          const [lng, lat] = coord as [number, number];
          bounds.extend([lng, lat]);
        });
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 16, duration: 1000 });
    }
  }, [townModel, mapLoaded]);

  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    if (!token || token === 'pk.your_mapbox_token_here') return;

    const { lng, lat } = centerRef.current;
    const proximity: [number, number] = [lng, lat];

    try {
      const res = await fetch(
        forwardGeocodeUrl({
          accessToken: token,
          query,
          proximity,
          limit: 8,
        }),
      );
      const json = await res.json();
      setSuggestions(
        (json.features ?? []).map((f: { place_name: string; center: [number, number] }) => ({
          place_name: f.place_name,
          center: f.center,
        })),
      );
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleInputChange = (val: string) => {
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 300);
  };

  const handleSelect = (address: string, proximityHint?: { lng: number; lat: number }) => {
    setSearchValue(address);
    setShowSuggestions(false);
    onAddressSelect(address, proximityHint);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Search overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative max-w-lg">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchValue.trim()) {
                handleSelect(searchValue.trim(), centerRef.current);
              }
            }}
            placeholder={`Try "${DEMO_ADDRESS}" for instant demo…`}
            className="w-full px-4 py-2.5 text-sm font-mono rounded"
            style={{
              background: 'rgba(10,14,23,0.92)',
              border: '1px solid #1e2a3a',
              color: '#f0f4f8',
              outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span
                className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#ef4444', borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full mt-1 w-full rounded overflow-hidden"
              style={{
                background: 'rgba(20,25,38,0.97)',
                border: '1px solid #1e2a3a',
                backdropFilter: 'blur(8px)',
              }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() =>
                    handleSelect(s.place_name, { lng: s.center[0], lat: s.center[1] })
                  }
                  className="w-full text-left px-4 py-2 text-sm font-mono transition-colors"
                  style={{ color: '#8899aa' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1e2a3a';
                    (e.currentTarget as HTMLButtonElement).style.color = '#f0f4f8';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#8899aa';
                  }}
                >
                  {s.place_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick demo button */}
        {!townModel && !loading && (
          <button
            onClick={() => handleSelect(DEMO_ADDRESS, DEMO_PROXIMITY)}
            className="mt-2 px-3 py-1.5 text-xs font-mono rounded transition-all"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#ef4444',
            }}
          >
            ▶ LOAD DEMO: Moore, Oklahoma
          </button>
        )}
      </div>

      {/* Building count overlay */}
      {townModel && (
        <div
          className="absolute bottom-4 left-4 px-3 py-2 rounded font-mono text-xs"
          style={{
            background: 'rgba(10,14,23,0.88)',
            border: '1px solid #1e2a3a',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span className="text-[#22d3ee]">{townModel.buildings.length}</span>
          <span className="text-[#556677]"> buildings loaded · </span>
          <span className="text-[#4ade80]">ready to simulate</span>
        </div>
      )}

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
