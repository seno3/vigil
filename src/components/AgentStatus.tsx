'use client';

import { AgentOutput, AgentStatus } from '@/types';

interface AgentStatusProps {
  agent: AgentOutput['agent'];
  status: AgentStatus;
  output: AgentOutput | null;
}

const AGENT_META: Record<
  AgentOutput['agent'],
  { label: string; color: string; icon: string; description: string }
> = {
  path: {
    label: 'TORNADO PATH',
    color: '#ef4444',
    icon: '🌪',
    description: 'Meteorological path analysis & physics',
  },
  structural: {
    label: 'STRUCTURAL IMPACT',
    color: '#ff6b2b',
    icon: '🏚',
    description: 'Per-building damage assessment',
  },
  evacuation: {
    label: 'EVACUATION',
    color: '#4ade80',
    icon: '🚨',
    description: 'Routes, blocked roads & casualties',
  },
  response: {
    label: 'EMERGENCY RESPONSE',
    color: '#22d3ee',
    icon: '🚑',
    description: 'Resource deployment plan',
  },
};

function StatusDot({ status, color }: { status: AgentStatus; color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{
        background: status === 'complete' ? color : status === 'running' ? color : '#2a3a50',
        boxShadow: status === 'running' ? `0 0 8px ${color}` : 'none',
        animation: status === 'running' ? 'pulse 1s ease-in-out infinite' : 'none',
      }}
    />
  );
}

export default function AgentStatusCard({ agent, status, output }: AgentStatusProps) {
  const meta = AGENT_META[agent];
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isIdle = status === 'idle';

  const summary = output?.data.summary ?? output?.data.reasoning ?? null;
  const confidence = output?.type === 'final' ? output.data.confidence : null;

  return (
    <div
      className="rounded p-3 transition-all duration-300"
      style={{
        background: '#141926',
        border: `1px solid ${isRunning || isComplete ? meta.color + '44' : '#1e2a3a'}`,
        borderTop: `2px solid ${isRunning || isComplete ? meta.color : '#1e2a3a'}`,
        boxShadow: isRunning ? `0 0 12px ${meta.color}22` : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <StatusDot status={status} color={meta.color} />
          <span
            className="text-xs font-mono font-semibold tracking-widest"
            style={{ color: isIdle ? '#556677' : meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: isIdle ? '#556677' : '#8899aa' }}
        >
          {isRunning ? 'RUNNING...' : isComplete ? 'COMPLETE' : 'STANDBY'}
        </span>
      </div>

      {!isIdle && (
        <>
          <p className="text-xs text-[#556677] font-mono mb-2">{meta.description}</p>

          {summary && (
            <p
              className="text-xs font-mono leading-relaxed"
              style={{ color: isRunning ? '#8899aa' : '#f0f4f8' }}
            >
              {summary.length > 140 ? summary.slice(0, 140) + '…' : summary}
            </p>
          )}

          {confidence !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span style={{ color: '#556677' }}>CONFIDENCE</span>
                <span style={{ color: meta.color }}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
              <div className="h-1 rounded-full" style={{ background: '#1e2a3a' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round(confidence * 100)}%`,
                    background: meta.color,
                    boxShadow: `0 0 6px ${meta.color}`,
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
