'use client';

import { TownModel, AgentOutput, AgentStatus, DamageLevel } from '@/types';
import AgentStatusCard from './AgentStatus';
import SimControls from './SimControls';
import CostTicker from './CostTicker';

interface DashboardProps {
  address: string;
  townModel: TownModel | null;
  efScale: number;
  windDirection: string;
  agentStatuses: Record<AgentOutput['agent'], AgentStatus>;
  agentOutputs: Partial<Record<AgentOutput['agent'], AgentOutput>>;
  simStatus: 'idle' | 'loading' | 'simulating' | 'complete' | 'error';
  onEfChange: (ef: number) => void;
  onWindChange: (dir: string) => void;
  onSimulate: () => void;
  errorMsg?: string;
}

const AGENTS: AgentOutput['agent'][] = ['path', 'structural', 'evacuation', 'response'];

export default function Dashboard({
  address,
  townModel,
  efScale,
  windDirection,
  agentStatuses,
  agentOutputs,
  simStatus,
  onEfChange,
  onWindChange,
  onSimulate,
  errorMsg,
}: DashboardProps) {
  const structuralOutput = agentOutputs['structural'];
  const evacuationOutput = agentOutputs['evacuation'];
  const responseOutput = agentOutputs['response'];

  // Stats
  const damageLevels = structuralOutput?.data.damage_levels ?? {};
  const destroyed = Object.values(damageLevels).filter((v) => v === 'destroyed').length;
  const major = Object.values(damageLevels).filter((v) => v === 'major').length;
  const minor = Object.values(damageLevels).filter((v) => v === 'minor').length;
  const casualties = evacuationOutput?.data.estimated_casualties ?? structuralOutput?.data.estimated_casualties ?? 0;
  const blockedRoads = [
    ...(structuralOutput?.data.blocked_roads ?? []),
    ...(evacuationOutput?.data.blocked_roads ?? []),
  ].length;

  const deployments = responseOutput?.data.deployments ?? [];

  const isSimulating = simStatus === 'simulating';
  const isComplete = simStatus === 'complete';
  const canSimulate = !!townModel && simStatus !== 'simulating';

  return (
    <div
      className="h-full flex flex-col gap-3 overflow-y-auto p-4"
      style={{ background: '#0a0e17' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isSimulating ? '#ef4444' : isComplete ? '#4ade80' : '#2a3a50',
                boxShadow: isSimulating ? '0 0 8px #ef4444' : 'none',
                animation: isSimulating ? 'pulse 1s infinite' : 'none',
              }}
            />
            <span className="text-xs font-mono text-[#556677] tracking-widest">
              {isSimulating ? 'SIMULATION ACTIVE' : isComplete ? 'SIMULATION COMPLETE' : 'VORTEX SIMULATOR'}
            </span>
          </div>
          {address && (
            <p className="text-sm font-mono text-[#f0f4f8] mt-0.5 truncate max-w-[220px]">
              {address}
            </p>
          )}
        </div>
        <div
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            background: '#141926',
            color: '#22d3ee',
            border: '1px solid #1e2a3a',
          }}
        >
          VULTR
        </div>
      </div>

      <div style={{ height: '1px', background: '#1e2a3a' }} />

      {/* Sim controls */}
      <SimControls
        efScale={efScale}
        windDirection={windDirection}
        onEfChange={onEfChange}
        onWindChange={onWindChange}
        onSimulate={onSimulate}
        disabled={!canSimulate}
        loading={isSimulating}
      />

      {errorMsg && (
        <div
          className="text-xs font-mono p-2 rounded"
          style={{ background: '#1a0a0a', color: '#ef4444', border: '1px solid #ef444433' }}
        >
          {errorMsg}
        </div>
      )}

      {/* Town stats */}
      {townModel && (
        <>
          <div style={{ height: '1px', background: '#1e2a3a' }} />
          <div>
            <span className="text-xs font-mono text-[#556677] tracking-widest">AREA LOADED</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Stat label="BUILDINGS" value={townModel.buildings.length.toString()} />
              <Stat label="POPULATION" value={`~${townModel.population_estimate.toLocaleString()}`} />
              <Stat label="ROADS" value={townModel.roads.length.toString()} />
              <Stat
                label="INFRA"
                value={townModel.infrastructure.length.toString()}
              />
            </div>
          </div>
        </>
      )}

      {/* Impact summary */}
      {(isSimulating || isComplete) && (
        <>
          <div style={{ height: '1px', background: '#1e2a3a' }} />
          <div>
            <span className="text-xs font-mono text-[#556677] tracking-widest">IMPACT SUMMARY</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Stat label="DESTROYED" value={destroyed.toString()} color="#ef4444" />
              <Stat label="MAJOR DMG" value={major.toString()} color="#ff6b2b" />
              <Stat label="MINOR DMG" value={minor.toString()} color="#ecc94b" />
              <Stat label="CASUALTIES" value={casualties.toString()} color="#ef4444" />
              <Stat label="ROADS BLOCKED" value={blockedRoads.toString()} color="#ff6b2b" colSpan />
            </div>
          </div>
        </>
      )}

      {/* Agent status panels */}
      {(isSimulating || isComplete) && (
        <>
          <div style={{ height: '1px', background: '#1e2a3a' }} />
          <div>
            <span className="text-xs font-mono text-[#556677] tracking-widest mb-2 block">
              AGENT STATUS
            </span>
            <div className="space-y-2">
              {AGENTS.map((agent) => (
                <AgentStatusCard
                  key={agent}
                  agent={agent}
                  status={agentStatuses[agent]}
                  output={agentOutputs[agent] ?? null}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Response plan */}
      {deployments.length > 0 && (
        <>
          <div style={{ height: '1px', background: '#1e2a3a' }} />
          <div>
            <span className="text-xs font-mono text-[#556677] tracking-widest mb-2 block">
              RESPONSE PLAN
            </span>
            <div className="space-y-1.5">
              {deployments.slice(0, 6).map((dep, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start p-2 rounded"
                  style={{ background: '#141926', border: '1px solid #1e2a3a' }}
                >
                  <span className="text-xs font-mono text-[#22d3ee] shrink-0 uppercase">
                    {dep.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-[#8899aa] leading-tight">
                    {dep.reason.length > 80 ? dep.reason.slice(0, 80) + '…' : dep.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cost ticker */}
      {(isSimulating || isComplete) && (
        <>
          <div style={{ height: '1px', background: '#1e2a3a' }} />
          <CostTicker agentStatuses={agentStatuses} />
        </>
      )}

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  colSpan,
}: {
  label: string;
  value: string;
  color?: string;
  colSpan?: boolean;
}) {
  return (
    <div
      className={`p-2 rounded ${colSpan ? 'col-span-2' : ''}`}
      style={{ background: '#141926', border: '1px solid #1e2a3a' }}
    >
      <div className="text-xs font-mono text-[#556677] mb-0.5">{label}</div>
      <div
        className="text-lg font-mono font-semibold"
        style={{ color: color ?? '#f0f4f8' }}
      >
        {value}
      </div>
    </div>
  );
}
