'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { User, TipCategory, TipUrgency, ThreatState, Emergency } from '@/types';
import TopBar from '@/components/TopBar';
import NotificationFeed from '@/components/NotificationFeed';
import TipModal from '@/components/TipModal';
import AuthModal from '@/components/AuthModal';
import AlertBanner from '@/components/AlertBanner';
import EmergencyOverlay from '@/components/emergency/EmergencyOverlay';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [is3D, setIs3D] = useState(true);
  const radius = 1609;
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
  const [revealed, setRevealed] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const prevActiveRef = useRef(false);

  // Poll for active emergency every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/emergencies');
        const { emergency } = await res.json();

        if (emergency && !prevActiveRef.current) {
          prevActiveRef.current = true;
          setActiveEmergency(emergency);
          setEmergencyVisible(true);
        } else if (!emergency && prevActiveRef.current) {
          prevActiveRef.current = false;
          setEmergencyVisible(false);
          setTimeout(() => setActiveEmergency(null), 400);
        }
      } catch { /* silent */ }
    };

    poll();
    const id = setInterval(poll, 5_000);
    return () => clearInterval(id);
  }, []);

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

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {alertMsg && <AlertBanner message={alertMsg} onDismiss={() => setAlertMsg(null)} />}

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <TopBar
          user={user} is3D={is3D}
          onToggle3D={() => setIs3D(v => !v)}
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
            onReady={() => setRevealed(true)}
            onMapClick={handleMapClick}
            onBuildingClick={handleBuildingClick}
          />
          {/* Report button */}
          <button
            onClick={() => user ? setTipModal({ lng: center[0], lat: center[1] }) : setShowAuth(true)}
            style={{
              position: 'absolute', bottom: '64px', left: '50%', transform: 'translateX(-50%)',
              background: '#dc2626', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px',
              padding: '12px 32px', fontSize: '12px', letterSpacing: '0.25em',
              fontFamily: 'var(--font-sans, sans-serif)', color: '#ffffff', cursor: 'pointer',
              textTransform: 'uppercase', zIndex: 10,
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
        <NotificationFeed lng={center[0]} lat={center[1]} radius={radius} />
      </div>

      {tipModal && <TipModal {...tipModal} onClose={() => setTipModal(null)} onSubmit={handleTipSubmit} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={u => setUser(u as User)} />}

      {activeEmergency && (
        <EmergencyOverlay emergency={activeEmergency} visible={emergencyVisible} />
      )}

      {/* Reveal overlay — starts black, fades out once map is idle */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000',
          opacity: revealed ? 0 : 1,
          transition: 'opacity 300ms ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
