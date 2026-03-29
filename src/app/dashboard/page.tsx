'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { User, TipCategory, TipUrgency, ThreatState } from '@/types';
import TopBar from '@/components/TopBar';
import NotificationFeed from '@/components/NotificationFeed';
import TipModal from '@/components/TipModal';
import AuthModal from '@/components/AuthModal';
import AlertBanner from '@/components/AlertBanner';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [radius, setRadius] = useState(1609);
  const [center, setCenter] = useState<[number, number]>([-87.6298, 41.8781]);
  const [threatBuildings, setThreatBuildings] = useState<Record<string, ThreatState['threatLevel']>>({});
  const [tipModal, setTipModal] = useState<{ lng: number; lat: number; buildingId?: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

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
    navigator.geolocation?.getCurrentPosition(pos => {
      setCenter([pos.coords.longitude, pos.coords.latitude]);
    });
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
      <TopBar user={user} is3D={is3D} radius={radius} onToggle3D={() => setIs3D(v => !v)} onRadiusChange={setRadius} onLocate={handleLocate} onAuthOpen={() => setShowAuth(true)} />
      <div style={{ flex: 1, display: 'flex', paddingTop: '56px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            threatBuildings={threatBuildings}
            is3D={is3D}
            center={center}
            onMapClick={handleMapClick}
            onBuildingClick={handleBuildingClick}
          />
          <button onClick={() => user ? setTipModal({ lng: center[0], lat: center[1] }) : setShowAuth(true)} style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '999px', padding: '12px 32px', fontSize: '12px', letterSpacing: '0.25em', fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', textTransform: 'uppercase', zIndex: 10 }}>
            + REPORT
          </button>
        </div>
        <NotificationFeed lng={center[0]} lat={center[1]} radius={radius} />
      </div>
      {tipModal && <TipModal {...tipModal} onClose={() => setTipModal(null)} onSubmit={handleTipSubmit} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={u => setUser(u as User)} />}
    </div>
  );
}
