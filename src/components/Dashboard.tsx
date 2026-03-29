'use client';

import { TownModel, AgentOutput, AgentStatus } from '@/types';
import AgentStatusCard from './AgentStatus';
import SimControls from './SimControls';
import CostTicker from './CostTicker';
import StreetView from './StreetView';

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
  tornadoPosition?: { lat: number; lng: number };
}

const AGENTS: AgentOutput['agent'][] = ['path', 'structural', 'evacuation', 'response'];

const AGENT_LABELS: Record<AgentOutput['agent'], string> = {
  path:        'PATH ANALYSIS',
  structural:  'STRUCTURAL DMG',
  evacuation:  'EVACUATION',
  response:    'RESPONSE PLAN',
};

const AGENT_ICONS: Record<AgentOutput['agent'], string> = {
  path:       '⌁',
  structural: '⬡',
  evacuation: '↗',
  response:   '✦',
};

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
  tornadoPosition,
}: DashboardProps) {
  const structuralOutput  = agentOutputs['structural'];
  const evacuationOutput  = agentOutputs['evacuation'];
  const responseOutput    = agentOutputs['response'];

  const damageLevels  = structuralOutput?.data.damage_levels ?? {};
  const destroyed     = Object.values(damageLevels).filter((v) => v === 'destroyed').length;
  const major         = Object.values(damageLevels).filter((v) => v === 'major').length;
  const minor         = Object.values(damageLevels).filter((v) => v === 'minor').length;
  const casualties    =
    evacuationOutput?.data.estimated_casualties ??
    structuralOutput?.data.estimated_casualties ??
    0;
  const blockedRoads  = [
    ...(structuralOutput?.data.blocked_roads ?? []),
    ...(evacuationOutput?.data.blocked_roads ?? []),
  ].length;

  const deployments = responseOutput?.data.deployments ?? [];

  const isSimulating = simStatus === 'simulating';
  const isComplete   = simStatus === 'complete';
  const isLoading    = simStatus === 'loading';
  const canSimulate  = !!townModel && simStatus !== 'simulating';

  const agentsDone    = AGENTS.filter((a) => agentStatuses[a] === 'complete').length;
  const progressPct   = isComplete ? 100 : Math.round((agentsDone / AGENTS.length) * 100);

  const showStreetView = (isSimulating || isComplete) && !!tornadoPosition;

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 4px #f05252; }
          50%       { box-shadow: 0 0 16px #f05252, 0 0 32px #f0525244; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes count-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes agent-enter {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .dashboard-scrollbar::-webkit-scrollbar { width: 3px; }
        .dashboard-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .dashboard-scrollbar::-webkit-scrollbar-thumb { background: #2a3a50; border-radius: 2px; }
        .stat-value  { animation: count-up 0.4s ease-out both; }
        .agent-row   { animation: agent-enter 0.3s ease-out both; }
      `}</style>

      <div
        className="h-full flex flex-col overflow-y-auto dashboard-scrollbar relative"
        style={{
          background:  '#0f1623',
          fontFamily:  'ui-monospace, "Cascadia Code", "Fira Code", monospace',
        }}
      >
        {/* Scanline */}
        {isSimulating && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden" style={{ opacity: 0.03 }}>
            <div style={{ position: 'absolute', width: '100%', height: '2px', background: '#f05252', animation: 'scanline 2s linear infinite' }} />
          </div>
        )}

        {/* Status bar */}
        <div
          className="shrink-0 px-4 py-2.5 flex items-center justify-between"
          style={{
            background:   isSimulating ? 'rgba(240,82,82,0.07)' : isComplete ? 'rgba(74,222,128,0.05)' : '#161e2e',
            borderBottom: `1px solid ${isSimulating ? '#f0525233' : '#2a3a50'}`,
            transition:   'all 0.5s ease',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width:      '6px',
                height:     '6px',
                borderRadius: '50%',
                background:  isSimulating ? '#f05252' : isComplete ? '#4ade80' : '#2a3a50',
                animation:   isSimulating ? 'pulse-red 1.2s ease-in-out infinite' : 'none',
                transition:  'background 0.3s ease',
              }}
            />
            <span
              className="text-xs tracking-widest"
              style={{
                color:     isSimulating ? '#f05252' : isComplete ? '#4ade80' : '#4a6080',
                animation: isSimulating ? 'blink 2s ease-in-out infinite' : 'none',
              }}
            >
              {isSimulating ? 'SIMULATION ACTIVE' : isComplete ? 'SIMULATION COMPLETE' : isLoading ? 'LOADING AREA DATA' : 'STANDBY'}
            </span>
          </div>
          <div
            className="text-xs px-2 py-0.5 rounded-sm"
            style={{ background: '#1a2235', color: '#38bdf8', border: '1px solid #38bdf822', letterSpacing: '0.1em' }}
          >
            VULTR
          </div>
        </div>

        {/* Progress bar */}
        {(isSimulating || isComplete) && (
          <div style={{ height: '2px', background: '#161e2e', position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position:   'absolute',
                top: 0, left: 0, height: '100%',
                width:      `${progressPct}%`,
                background: isComplete ? 'linear-gradient(90deg, #4ade80, #38bdf8)' : 'linear-gradient(90deg, #f05252, #fb923c)',
                transition: 'width 0.6s ease',
                boxShadow:  isComplete ? '0 0 8px #4ade8088' : '0 0 8px #f0525288',
              }}
            />
          </div>
        )}

        <div className="flex-1 p-4 flex flex-col gap-5">

          {/* Address */}
          {address && (
            <div>
              <SectionLabel>TARGET LOCATION</SectionLabel>
              <div
                className="mt-1.5 px-3 py-2 rounded-sm text-sm truncate"
                style={{ background: '#1a2235', border: '1px solid #2a3a50', color: '#f0f6ff', letterSpacing: '0.02em', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
              >
                {address}
              </div>
            </div>
          )}

          {/* Sim Controls */}
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
              className="text-xs p-3 rounded-sm"
              style={{ background: '#1a0d0d', color: '#f05252', border: '1px solid #f0525233', lineHeight: '1.5' }}
            >
              ⚠ {errorMsg}
            </div>
          )}

          {/* Area stats */}
          {townModel && (
            <div>
              <SectionLabel>AREA INVENTORY</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <AreaStat label="BUILDINGS"      value={townModel.buildings.length.toLocaleString()} />
                <AreaStat label="POPULATION"     value={`~${townModel.population_estimate.toLocaleString()}`} />
                <AreaStat label="ROAD SEGMENTS"  value={townModel.roads.length.toLocaleString()} />
                <AreaStat label="INFRASTRUCTURE" value={townModel.infrastructure.length.toLocaleString()} />
              </div>
            </div>
          )}

          {/* Impact summary */}
          {(isSimulating || isComplete) && (
            <div>
              <SectionLabel>IMPACT ASSESSMENT</SectionLabel>
              <div className="mt-2 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <ImpactStat label="DESTROYED"  value={destroyed}  tier="critical" loading={!structuralOutput} />
                  <ImpactStat label="CASUALTIES" value={casualties} tier="critical" loading={!evacuationOutput && !structuralOutput} />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <ImpactStat label="MAJOR DAMAGE"   value={major}        tier="warning" loading={!structuralOutput} />
                  <ImpactStat label="ROADS BLOCKED"  value={blockedRoads} tier="warning" loading={!structuralOutput && !evacuationOutput} />
                </div>
                <ImpactStat label="MINOR DAMAGE" value={minor} tier="minor" loading={!structuralOutput} wide />
              </div>
            </div>
          )}

          {/* Street View panel */}
          {showStreetView && (
            <div>
              <SectionLabel>IMPACT ZONE · STREET LEVEL</SectionLabel>
              <div className="mt-2">
                <StreetView lat={tornadoPosition!.lat} lng={tornadoPosition!.lng} />
              </div>
            </div>
          )}

          {/* Agent pipeline */}
          {(isSimulating || isComplete) && (
            <div>
              <SectionLabel>AGENT PIPELINE</SectionLabel>
              <div className="mt-2 space-y-1">
                {AGENTS.map((agent, i) => {
                  const status    = agentStatuses[agent];
                  const isDone    = status === 'complete';
                  const isRunning = status === 'running';

                  return (
                    <div
                      key={agent}
                      className="agent-row flex items-center gap-3 px-3 py-2.5 rounded-sm"
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        background: isRunning ? '#1e2a3a' : isDone ? '#192a1e' : '#161e2e',
                        border:     `1px solid ${isRunning ? '#f0525233' : isDone ? '#4ade8022' : '#2a3a50'}`,
                        transition: 'all 0.4s ease',
                        boxShadow:  '0 1px 3px rgba(0,0,0,0.4)',
                      }}
                    >
                      <span
                        style={{
                          fontSize:   '14px',
                          color:      isRunning ? '#f05252' : isDone ? '#4ade80' : '#4a6080',
                          animation:  isRunning ? 'blink 1s ease-in-out infinite' : 'none',
                          minWidth:   '16px',
                          textAlign:  'center',
                        }}
                      >
                        {AGENT_ICONS[agent]}
                      </span>
                      <span
                        className="text-sm flex-1"
                        style={{
                          color:          isRunning ? '#f0f6ff' : isDone ? '#8fa8c0' : '#4a6080',
                          letterSpacing:  '0.08em',
                          transition:     'color 0.3s ease',
                        }}
                      >
                        {AGENT_LABELS[agent]}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-sm"
                        style={{
                          background:    isRunning ? '#f0525222' : isDone ? '#4ade8022' : '#1a2235',
                          color:         isRunning ? '#f05252'   : isDone ? '#4ade80'   : '#4a6080',
                          letterSpacing: '0.06em',
                          fontSize:      '9px',
                        }}
                      >
                        {isRunning ? 'RUNNING' : isDone ? 'DONE' : 'WAIT'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Agent detail cards */}
              <div className="mt-2 space-y-1">
                {AGENTS.map((agent) =>
                  agentOutputs[agent] ? (
                    <AgentStatusCard
                      key={agent}
                      agent={agent}
                      status={agentStatuses[agent]}
                      output={agentOutputs[agent] ?? null}
                    />
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Response deployments */}
          {deployments.length > 0 && (
            <div>
              <SectionLabel>RESPONSE DEPLOYMENTS</SectionLabel>
              <div className="mt-2 space-y-1">
                {deployments.slice(0, 6).map((dep, i) => (
                  <div
                    key={i}
                    className="flex gap-2.5 items-start px-3 py-2 rounded-sm"
                    style={{ background: '#1a2235', border: '1px solid #2a3a50', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    <span
                      className="text-xs shrink-0 px-1.5 py-0.5 rounded-sm"
                      style={{
                        background:    '#38bdf815',
                        color:         '#38bdf8',
                        border:        '1px solid #38bdf822',
                        letterSpacing: '0.06em',
                        fontSize:      '9px',
                        marginTop:     '1px',
                        textTransform: 'uppercase',
                        whiteSpace:    'nowrap',
                      }}
                    >
                      {dep.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: '#8fa8c0' }}>
                      {dep.reason.length > 90 ? dep.reason.slice(0, 90) + '…' : dep.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost ticker */}
          {(isSimulating || isComplete) && (
            <div>
              <SectionLabel>COMPUTE COST</SectionLabel>
              <div className="mt-2">
                <CostTicker agentStatuses={agentStatuses} />
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs tracking-widest"
        style={{ color: '#8fa8c0', letterSpacing: '0.14em' }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#2a3a50' }} />
    </div>
  );
}

function AreaStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="px-3 py-2 rounded-sm"
      style={{ background: '#1a2235', border: '1px solid #2a3a50', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      <div className="text-xs mb-0.5" style={{ color: '#8fa8c0', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: '#f0f6ff' }}>
        {value}
      </div>
    </div>
  );
}

function ImpactStat({
  label,
  value,
  tier,
  loading,
  wide,
}: {
  label:    string;
  value:    number;
  tier:     'critical' | 'warning' | 'minor';
  loading?: boolean;
  wide?:    boolean;
}) {
  const colors = {
    critical: { text: '#f05252', bg: 'rgba(240,82,82,0.07)',   border: '#f0525233', glow: '#f0525266' },
    warning:  { text: '#fb923c', bg: 'rgba(251,146,60,0.06)',  border: '#fb923c33', glow: 'transparent' },
    minor:    { text: '#ecc94b', bg: 'rgba(236,201,75,0.05)',  border: '#ecc94b22', glow: 'transparent' },
  };
  const c = colors[tier];

  return (
    <div
      className={`px-3 py-2.5 rounded-sm ${wide ? 'col-span-2' : ''}`}
      style={{
        background: loading ? '#1a2235' : c.bg,
        border:     `1px solid ${loading ? '#2a3a50' : c.border}`,
        transition: 'all 0.5s ease',
        boxShadow:  '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: '#8fa8c0', letterSpacing: '0.1em' }}>
        {label}
      </div>
      {loading ? (
        <div
          style={{
            height:          '24px',
            width:           '40%',
            background:      'linear-gradient(90deg, #1e2a3a 25%, #2a3a50 50%, #1e2a3a 75%)',
            backgroundSize:  '200% 100%',
            animation:       'shimmer 1.5s ease-in-out infinite',
            borderRadius:    '2px',
          }}
        />
      ) : (
        <div
          className="stat-value text-2xl font-bold"
          style={{
            color:      c.text,
            textShadow: tier === 'critical' && value > 0 ? `0 0 20px ${c.glow}` : 'none',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {value.toLocaleString()}
        </div>
      )}
    </div>
  );
}
