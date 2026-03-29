'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary, type APIOptions } from '@googlemaps/js-api-loader';

interface StreetViewProps {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
}

type ViewMode = 'before' | 'after';

export default function StreetView({ lat, lng, heading, pitch }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode]       = useState<ViewMode>('before');
  const [failed, setFailed]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setFailed(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);

    const opts: APIOptions = { key: apiKey, v: 'weekly' };
    setOptions(opts);

    let cancelled = false;

    (async () => {
      try {
        const streetViewLib = await importLibrary('streetView') as typeof google.maps;
        const { StreetViewPanorama, StreetViewService, StreetViewStatus } = streetViewLib;

        if (cancelled || !containerRef.current) return;

        const sv = new StreetViewService();
        sv.getPanorama(
          { location: { lat, lng }, radius: 100 },
          (
            _data: google.maps.StreetViewPanoramaData | null,
            status: google.maps.StreetViewStatus
          ) => {
            if (cancelled || !containerRef.current) return;

            if (status !== StreetViewStatus.OK) {
              setFailed(true);
              setLoading(false);
              return;
            }

            new StreetViewPanorama(containerRef.current!, {
              position:              { lat, lng },
              pov:                   { heading: heading ?? 0, pitch: pitch ?? 0 },
              zoom:                  1,
              addressControl:        false,
              showRoadLabels:        false,
              zoomControl:           false,
              fullscreenControl:     false,
              motionTracking:        false,
              motionTrackingControl: false,
            });

            setLoading(false);
          }
        );
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [lat, lng, heading, pitch]);

  return (
    <div
      style={{
        position:     'relative',
        width:        '100%',
        height:       '200px',
        background:   '#0d1420',
        overflow:     'hidden',
        border:       '1px solid #2a3a50',
        borderRadius: '2px',
      }}
    >
      {/* Street View render target */}
      <div
        ref={containerRef}
        style={{
          width:      '100%',
          height:     '100%',
          filter:     mode === 'after' ? 'sepia(0.4) contrast(1.2) brightness(0.7)' : 'none',
          transition: 'filter 0.4s ease',
        }}
      />

      {/* After-mode dust overlay */}
      {mode === 'after' && !failed && (
        <div
          style={{
            position:      'absolute',
            inset:         0,
            background:    'rgba(180, 60, 20, 0.15)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1420' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6080', letterSpacing: '0.12em' }}>
            LOADING STREET VIEW…
          </span>
        </div>
      )}

      {/* Failure state */}
      {failed && !loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0d1420' }}>
          <span style={{ fontSize: '20px', opacity: 0.3 }}>⊘</span>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4a6080', letterSpacing: '0.12em', textAlign: 'center', padding: '0 16px' }}>
            NO STREET VIEW AVAILABLE AT THIS LOCATION
          </span>
        </div>
      )}

      {/* Top-left label */}
      {!failed && !loading && (
        <div style={{ position: 'absolute', top: 6, left: 8, fontFamily: 'monospace', fontSize: '9px', color: '#38bdf8', letterSpacing: '0.12em', background: 'rgba(10,14,23,0.75)', padding: '2px 6px', borderRadius: '2px', pointerEvents: 'none' }}>
          GROUND LEVEL VIEW
        </div>
      )}

      {/* Bottom-right coordinates */}
      {!failed && !loading && (
        <div style={{ position: 'absolute', bottom: 6, right: 8, fontFamily: 'monospace', fontSize: '9px', color: '#4a6080', letterSpacing: '0.08em', background: 'rgba(10,14,23,0.75)', padding: '2px 6px', borderRadius: '2px', pointerEvents: 'none' }}>
          {Math.abs(lat).toFixed(4)}° {lat >= 0 ? 'N' : 'S'}&nbsp;&nbsp;
          {Math.abs(lng).toFixed(4)}° {lng >= 0 ? 'E' : 'W'}
        </div>
      )}

      {/* Before / After toggle */}
      {!failed && !loading && (
        <button
          onClick={() => setMode((m) => (m === 'before' ? 'after' : 'before'))}
          style={{
            position:      'absolute',
            top:           6,
            right:         8,
            fontFamily:    'monospace',
            fontSize:      '9px',
            letterSpacing: '0.1em',
            color:         mode === 'after' ? '#f05252' : '#8fa8c0',
            background:    'rgba(10,14,23,0.85)',
            border:        `1px solid ${mode === 'after' ? '#f05252' : '#2a3a50'}`,
            borderRadius:  '2px',
            padding:       '2px 7px',
            cursor:        'pointer',
            transition:    'all 0.2s ease',
          }}
        >
          {mode === 'before' ? 'BEFORE' : 'AFTER'}
        </button>
      )}
    </div>
  );
}
