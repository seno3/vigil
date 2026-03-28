'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { TownModel, AgentOutput, AgentStatus, SimulationState } from '@/types';
import Dashboard from '@/components/Dashboard';

// Dynamic imports to avoid SSR issues with mapbox-gl and three.js
const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const Scene3D = dynamic(() => import('@/components/Scene3D'), { ssr: false });

const INITIAL_STATE: SimulationState = {
  status: 'idle',
  townModel: null,
  agentStatuses: {
    path: 'idle',
    structural: 'idle',
    evacuation: 'idle',
    response: 'idle',
  },
  agentOutputs: {
    path: null,
    structural: null,
    evacuation: null,
    response: null,
  },
  efScale: 3,
  windDirection: 'SW',
  address: '',
};

export default function Home() {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [show3D, setShow3D] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const handleAddressSelect = useCallback(async (address: string) => {
    setState((s) => ({ ...s, status: 'loading', address, townModel: null }));
    setErrorMsg(undefined);

    try {
      const res = await fetch('/api/town-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const json = await res.json();
      const townModel: TownModel = json.townModel;

      setState((s) => ({ ...s, status: 'idle', townModel }));
    } catch (err) {
      setErrorMsg(`Failed to load area: ${err}`);
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!state.townModel) return;

    // Reset agent state
    setState((s) => ({
      ...s,
      status: 'simulating',
      agentStatuses: {
        path: 'idle',
        structural: 'idle',
        evacuation: 'idle',
        response: 'idle',
      },
      agentOutputs: {
        path: null,
        structural: null,
        evacuation: null,
        response: null,
      },
    }));
    setErrorMsg(undefined);
    setShow3D(true); // Switch to 3D view immediately

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          townModel: state.townModel,
          efScale: state.efScale,
          windDirection: state.windDirection,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Simulation request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === 'done') {
              setState((s) => ({ ...s, status: 'complete' }));
              continue;
            }

            if (event.type === 'error') {
              setErrorMsg(event.message ?? 'Unknown simulation error');
              setState((s) => ({ ...s, status: 'error' }));
              continue;
            }

            const output = event as AgentOutput;
            const agent = output.agent;

            setState((s) => {
              const newAgentStatuses = { ...s.agentStatuses };
              const newAgentOutputs = { ...s.agentOutputs };

              if (output.type === 'update') {
                newAgentStatuses[agent] = 'running';
              } else if (output.type === 'final') {
                newAgentStatuses[agent] = 'complete';
                newAgentOutputs[agent] = output;
              }

              return { ...s, agentStatuses: newAgentStatuses, agentOutputs: newAgentOutputs };
            });
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setErrorMsg(`Simulation failed: ${err}`);
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, [state.townModel, state.efScale, state.windDirection]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
    setShow3D(false);
    setErrorMsg(undefined);
  }, []);

  const agentOutputsFiltered = Object.fromEntries(
    Object.entries(state.agentOutputs).filter(([, v]) => v !== null)
  ) as Partial<Record<AgentOutput['agent'], AgentOutput>>;

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: '#0a0e17' }}>
      {/* Header bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2"
        style={{
          background: 'rgba(10,14,23,0.95)',
          borderBottom: '1px solid #1e2a3a',
          backdropFilter: 'blur(8px)',
          height: '44px',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-base font-mono font-bold tracking-widest"
            style={{ color: '#ef4444' }}
          >
            VORTEX
          </span>
          <span className="text-xs font-mono text-[#2a3a50]">|</span>
          <span className="text-xs font-mono text-[#556677]">AI TORNADO IMPACT SIMULATOR</span>
        </div>
        <div className="flex items-center gap-3">
          {show3D && (
            <button
              onClick={() => setShow3D(false)}
              className="text-xs font-mono px-3 py-1 rounded transition-colors"
              style={{ color: '#8899aa', border: '1px solid #1e2a3a' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f0f4f8')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8899aa')}
            >
              ← MAP VIEW
            </button>
          )}
          {(state.status === 'simulating' || state.status === 'complete') && (
            <button
              onClick={handleReset}
              className="text-xs font-mono px-3 py-1 rounded transition-colors"
              style={{ color: '#8899aa', border: '1px solid #1e2a3a' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#ef4444')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8899aa')}
            >
              RESET
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#4ade80', boxShadow: '0 0 4px #4ade80' }}
            />
            <span className="text-xs font-mono text-[#4ade80]">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Main layout — 70/30 split */}
      <div className="flex w-full pt-[44px]">
        {/* Left: Map or 3D scene */}
        <div className="flex-1 relative" style={{ width: '70%' }}>
          {/* Map (always rendered but hidden when 3D is shown) */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: show3D ? 0 : 1, pointerEvents: show3D ? 'none' : 'auto' }}
          >
            <Map
              townModel={state.townModel}
              onAddressSelect={handleAddressSelect}
              loading={state.status === 'loading'}
            />
          </div>

          {/* 3D Scene */}
          {show3D && state.townModel && (
            <div className="absolute inset-0">
              <Scene3D
                townModel={state.townModel}
                agentOutputs={agentOutputsFiltered}
              />
            </div>
          )}

          {/* Transition to 3D prompt */}
          {!show3D && state.townModel && state.status === 'idle' && (
            <div
              className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded font-mono text-xs cursor-pointer transition-all"
              style={{
                background: 'rgba(10,14,23,0.9)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444',
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
            width: '30%',
            minWidth: '320px',
            maxWidth: '420px',
            borderLeft: '1px solid #1e2a3a',
          }}
        >
          <Dashboard
            address={state.address}
            townModel={state.townModel}
            efScale={state.efScale}
            windDirection={state.windDirection}
            agentStatuses={state.agentStatuses as Record<AgentOutput['agent'], AgentStatus>}
            agentOutputs={agentOutputsFiltered}
            simStatus={state.status}
            onEfChange={(ef) => setState((s) => ({ ...s, efScale: ef }))}
            onWindChange={(dir) => setState((s) => ({ ...s, windDirection: dir }))}
            onSimulate={handleSimulate}
            errorMsg={errorMsg}
          />
        </div>
      </div>
    </div>
  );
}
