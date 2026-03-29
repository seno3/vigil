'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { User, TipCategory, TipUrgency, ThreatState } from '@/types';
import TopBar from '@/components/TopBar';
import NotificationFeed from '@/components/NotificationFeed';
import TipModal from '@/components/TipModal';
import AuthModal from '@/components/AuthModal';
import AlertBanner from '@/components/AlertBanner';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const skipIntro = searchParams.get('skipIntro') === 'true';
  const [user, setUser] = useState<User | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [radius, setRadius] = useState(1609);
  const [center, setCenter] = useState<[number, number]>(() => {
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    return (isFinite(lat) && isFinite(lng)) ? [lng, lat] : [-87.6298, 41.8781];
  });
  const [threatBuildings, setThreatBuildings] = useState<Record<string, ThreatState['threatLevel']>>({});
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [tipModal, setTipModal] = useState<{ lng: number; lat: number; buildingId?: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [uiVisible, setUIVisible] = useState(!skipIntro);

  // If no flyTo transition incoming, reveal UI immediately on mount
  useEffect(() => {
    if (!skipIntro) setUIVisible(true);
  }, [skipIntro]);

  const refreshThreats = useCallback(async () => {
    const res = await fetch('/api/threats');
    const threats: ThreatState[] = await res.json();
    const map: Record<string, ThreatState['threatLevel']> = {};
    threats.forEach(t => { map[t.buildingId] = t.threatLevel; });
    setThreatBuildings(map);
    if (threats.some(t => t.threatLevel === 'critical')) {
      setAlertMsg('CRITICAL THREAT DETECTED NEARBY — Avoid the area and contact authorities.');
    }
  }, []);

  const handleMapClick = useCallback((lng: number, lat: number) => {
    if (!user) { setShowAuth(true); return; }
    setTipModal({ lng, lat });
  }, [user]);

  const handleBuildingClick = useCallback((lng: number, lat: number, buildingId: string) => {
    if (!user) { setShowAuth(true); return; }
    setTipModal({ lng, lat, buildingId });
  }, [user]);

  const handleLocate = useCallback(() => {
    setLocateTrigger(n => n + 1);
  }, []);

  const handleSignOut = useCallback(() => {
    setUser(null);
  }, []);

  const handleTipSubmit = useCallback(async (data: { category: TipCategory; description: string; urgency: TipUrgency }) => {
    if (!tipModal || !user) return;
    await fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lng: tipModal.lng, lat: tipModal.lat, buildingId: tipModal.buildingId, ...data }),
    });
    setTimeout(refreshThreats, 3000);
  }, [tipModal, user, refreshThreats]);

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: uiVisible ? 1 : 0,
    transform: uiVisible ? 'translateY(0)' : 'translateY(-6px)',
    transition: `opacity 600ms ${delay}ms ease-out, transform 600ms ${delay}ms ease-out`,
  });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {alertMsg && <AlertBanner message={alertMsg} onDismiss={() => setAlertMsg(null)} />}

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, ...fadeStyle(100) }}>
        <TopBar
          user={user} is3D={is3D} radius={radius}
          onToggle3D={() => setIs3D(v => !v)}
          onRadiusChange={setRadius}
          onLocate={handleLocate}
          onAuthOpen={() => setShowAuth(true)}
          onSignOut={handleSignOut}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', paddingTop: '56px' }}>
        {/* Map area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            threatBuildings={threatBuildings}
            is3D={is3D}
            center={center}
            locateTrigger={locateTrigger}
            onFlyEnd={skipIntro ? () => setUIVisible(true) : undefined}
            onMapClick={handleMapClick}
            onBuildingClick={handleBuildingClick}
          />
          {/* Report button */}
          <button
            onClick={() => user ? setTipModal({ lng: center[0], lat: center[1] }) : setShowAuth(true)}
            style={{
              position: 'absolute', bottom: '64px', left: '50%', transform: `translateX(-50%) ${uiVisible ? 'translateY(0)' : 'translateY(-6px)'}`,
              background: '#dc2626', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px',
              padding: '12px 32px', fontSize: '12px', letterSpacing: '0.25em',
              fontFamily: 'var(--font-sans, sans-serif)', color: '#ffffff', cursor: 'pointer',
              textTransform: 'uppercase', zIndex: 10,
              opacity: uiVisible ? 1 : 0,
              transition: `opacity 600ms 350ms ease-out, transform 600ms 350ms ease-out, background 150ms ease`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50%) scale(0.97)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50%) scale(1)'; }}
          >
            + REPORT
          </button>
        </div>

        {/* Feed panel */}
        <div style={fadeStyle(250)}>
          <NotificationFeed lng={center[0]} lat={center[1]} radius={radius} />
        </div>
      </div>

      {tipModal && <TipModal {...tipModal} onClose={() => setTipModal(null)} onSubmit={handleTipSubmit} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={u => setUser(u as User)} />}
    </div>
  );
}
