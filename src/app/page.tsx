'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

const PERIOD = 40000;

export default function LandingPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98, 39],
      zoom: 4.2,
      interactive: false,
      attributionControl: false,
    });
    map.on('load', () => setMapLoaded(true));

    const startLng = -98, startLat = 39;
    let raf: number;
    const drift = () => {
      if (window.innerWidth < 768) return;
      const t = Date.now() / PERIOD;
      map.setCenter({ lng: startLng + Math.sin(t * Math.PI * 2) * 1.2, lat: startLat + Math.cos(t * Math.PI * 2) * 0.6 });
      map.setBearing(Math.sin(t * Math.PI * 2) * 6);
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);
    return () => { map.remove(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, opacity: mapLoaded ? 1 : 0, transition: 'opacity 1.2s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '64px', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeUp 0.6s 0.4s both' }}>
        <span style={{ fontSize: '13px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.9)', fontFamily: 'ui-monospace, monospace' }}>VIGIL</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '999px', padding: '6px 16px', fontSize: '12px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace' }}>
            Sign in
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '44px', pointerEvents: 'none' }}>
        <h1 style={{ animation: 'fadeUp 0.6s 0.75s both', fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(72px,10vw,128px)', color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
          Vigil
        </h1>
        <div style={{ animation: 'fadeUp 0.6s 1.1s both', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '999px', padding: '12px 32px', fontSize: '12px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace' }}
            onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.25)'); (e.currentTarget.style.transform = 'scale(1.02)'); }}
            onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.15)'); (e.currentTarget.style.transform = 'scale(1)'); }}>
            OPEN
          </button>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.3)', animation: 'bounce 2s infinite' }}>⌄</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeUp 0.6s 1.3s both' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulseDot 1.5s infinite' }} />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>NOT A SUBSTITUTE FOR 911</span>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes pulseDot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } }
      `}</style>
    </div>
  );
}
