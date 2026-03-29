'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TownModel, AgentOutput } from '@/types';
import Dashboard from '@/components/Dashboard';
import { useSimulationWS } from '@/hooks/useSimulationWS';

// Dynamic imports to avoid SSR issues with mapbox-gl and three.js
const Map    = dynamic(() => import('@/components/Map'),    { ssr: false });
const Scene3D = dynamic(() => import('@/components/Scene3D'), { ssr: false });

export default function Home() {
  // ── Location / setup state ──────────────────────────────────────────────────
  const [townModel,      setTownModel]      = useState<TownModel | null>(null);
  const [efScale,        setEfScale]        = useState(3);
  const [windDirection,  setWindDirection]  = useState('SW');
  const [address,        setAddress]        = useState('Suburban Impact Zone — EF4 Scenario');
  const [loadStatus,     setLoadStatus]     = useState<'idle' | 'loading' | 'error'>('idle');
  const [loadError,      setLoadError]      = useState<string | undefined>();
  const [show3D,         setShow3D]         = useState(false);
  const [tornadoPosition, setTornadoPosition] = useState<{ lat: number; lng: number } | null>(null);

  // ── Simulation state (WebSocket) ────────────────────────────────────────────
  const {
    startSimulation,
    agentStatuses,
    agentOutputs,
    simStatus: wsStatus,
    errorMsg: wsError,
    reset: resetWS,
  } = useSimulationWS();

  // ── Combined status / error for Dashboard ───────────────────────────────────
  const simStatus = loadStatus === 'loading' ? 'loading' : wsStatus;
  const errorMsg  = loadError ?? wsError;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddressSelect = useCallback(async (addr: string) => {
    setLoadStatus('loading');
    setAddress(addr);
    setLoadError(undefined);
    setTownModel(null);

    try {
      const res  = await fetch('/api/town-model', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address: addr }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? `Request failed: ${res.status}`);
      }

      setTownModel(json.townModel as TownModel);
      setLoadStatus('idle');
    } catch (err) {
      setLoadError(`Failed to load area: ${err}`);
      setLoadStatus('error');
    }
  }, []);

  const handleSimulate = useCallback(() => {
    if (!townModel) return;
    setShow3D(true);
    setTornadoPosition(null);
    startSimulation(townModel, efScale, windDirection);
  }, [townModel, efScale, windDirection, startSimulation]);

  const handleReset = useCallback(() => {
    resetWS();
    setTownModel(null);
    setLoadStatus('idle');
    setLoadError(undefined);
    setAddress('Suburban Impact Zone — EF4 Scenario');
    setShow3D(false);
    setTornadoPosition(null);
  }, [resetWS]);

  const handlePositionUpdate = useCallback((lat: number, lng: number) => {
    setTornadoPosition({ lat, lng });
  }, []);

  // ── Filtered outputs (non-null) ─────────────────────────────────────────────
  const agentOutputsFiltered = Object.fromEntries(
    Object.entries(agentOutputs).filter(([, v]) => v !== null)
  ) as Partial<Record<AgentOutput['agent'], AgentOutput>>;

  const showReset = wsStatus === 'simulating' || wsStatus === 'complete';

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: '#0f1623' }}>
      {/* Header bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2"
        style={{
          background:    'rgba(15,22,35,0.95)',
          borderBottom:  '1px solid #2a3a50',
          backdropFilter: 'blur(8px)',
          height:        '44px',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-mono font-bold tracking-widest" style={{ color: '#f05252' }}>
            VORTEX
          </span>
          <span className="text-xs font-mono text-[#2a3a50]">|</span>
          <span className="text-xs font-mono" style={{ color: '#8fa8c0' }}>AI TORNADO IMPACT SIMULATOR</span>
          <span className="text-xs font-mono text-[#2a3a50]">|</span>
          <span className="text-xs font-mono" style={{ color: '#8fa8c0' }}>IMPACT ZONE  •  EF4 SCENARIO</span>
        </div>
        <div className="flex items-center gap-3">
          {show3D && (
            <button
              onClick={() => setShow3D(false)}
              className="text-xs font-mono px-3 py-1 rounded transition-colors"
              style={{ color: '#8fa8c0', border: '1px solid #2a3a50' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f0f6ff')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8fa8c0')}
            >
              ← MAP VIEW
            </button>
          )}
          {showReset && (
            <button
              onClick={handleReset}
              className="text-xs font-mono px-3 py-1 rounded transition-colors"
              style={{ color: '#8fa8c0', border: '1px solid #2a3a50' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f05252')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8fa8c0')}
            >
              RESET
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#4ade80', boxShadow: '0 0 4px #4ade80' }}
            />
            <span className="text-xs font-mono" style={{ color: '#4ade80' }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Main layout — 70/30 split */}
      <div className="flex w-full pt-[44px]">
        {/* Left: Map or 3D scene */}
        <div className="flex-1 relative" style={{ width: '70%' }}>
          {/* Map */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: show3D ? 0 : 1, pointerEvents: show3D ? 'none' : 'auto' }}
          >
            <Map
              townModel={townModel}
              onAddressSelect={handleAddressSelect}
              loading={loadStatus === 'loading'}
            />
          </div>

          {/* 3D Scene */}
          {show3D && townModel && (
            <div className="absolute inset-0">
              <Scene3D
                townModel={townModel}
                agentOutputs={agentOutputsFiltered}
                onPositionUpdate={handlePositionUpdate}
              />
            </div>
          )}

          {/* Preview 3D prompt */}
          {!show3D && townModel && wsStatus === 'idle' && loadStatus === 'idle' && (
            <div
              className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded font-mono text-xs cursor-pointer transition-all"
              style={{
                background:    'rgba(15,22,35,0.9)',
                border:        '1px solid rgba(240,82,82,0.4)',
                color:         '#f05252',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setShow3D(true)}
            >
              <span>▶ PREVIEW 3D SCENE</span>
            </div>
          )}
        </div>

        {/* Right: Dashboard */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width:      '30%',
            minWidth:   '320px',
            maxWidth:   '420px',
            borderLeft: '1px solid #2a3a50',
          }}
        >
          <Dashboard
            address={address}
            townModel={townModel}
            efScale={efScale}
            windDirection={windDirection}
            agentStatuses={agentStatuses as Record<AgentOutput['agent'], import('@/types').AgentStatus>}
            agentOutputs={agentOutputsFiltered}
            simStatus={simStatus}
            onEfChange={(ef) => setEfScale(ef)}
            onWindChange={(dir) => setWindDirection(dir)}
            onSimulate={handleSimulate}
            errorMsg={errorMsg}
            tornadoPosition={tornadoPosition ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
