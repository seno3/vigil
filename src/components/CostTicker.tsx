'use client';

import { useEffect, useState } from 'react';
import { AgentStatus } from '@/types';

interface CostTickerProps {
  agentStatuses: Record<string, AgentStatus>;
}

const AGENT_COSTS: Record<string, number> = {
  path: 0.003,
  structural: 0.005,
  evacuation: 0.003,
  response: 0.003,
};

export default function CostTicker({ agentStatuses }: CostTickerProps) {
  const [displayCost, setDisplayCost] = useState(0);

  const targetCost = Object.entries(agentStatuses)
    .filter(([, status]) => status === 'complete')
    .reduce((sum, [agent]) => sum + (AGENT_COSTS[agent] ?? 0), 0);

  useEffect(() => {
    if (targetCost <= displayCost) return;
    const start = displayCost;
    const end = targetCost;
    const duration = 600;
    const startTime = Date.now();

    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayCost(start + (end - start) * progress);
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [targetCost]);

  const anyRunning = Object.values(agentStatuses).some((s) => s === 'running');

  return (
    <div
      className="rounded p-3"
      style={{ background: '#141926', border: '1px solid #1e2a3a' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-[#556677] tracking-widest">COMPUTE COST</span>
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: anyRunning ? '#4ade80' : '#2a3a50',
              boxShadow: anyRunning ? '0 0 6px #4ade80' : 'none',
              animation: anyRunning ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span className="text-xs font-mono text-[#556677]">
            {anyRunning ? 'LIVE' : 'FINAL'}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-mono font-semibold text-[#4ade80]">
          ${displayCost.toFixed(4)}
        </span>
        <span className="text-xs font-mono text-[#556677]">USD</span>
      </div>

      <div className="space-y-1">
        {Object.entries(AGENT_COSTS).map(([agent, cost]) => {
          const status = agentStatuses[agent] ?? 'idle';
          const isComplete = status === 'complete';
          return (
            <div key={agent} className="flex justify-between items-center">
              <span
                className="text-xs font-mono"
                style={{ color: isComplete ? '#8899aa' : '#2a3a50' }}
              >
                Agent {agent.charAt(0).toUpperCase() + agent.slice(1)}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: isComplete ? '#4ade80' : '#2a3a50' }}
              >
                {isComplete ? `$${cost.toFixed(3)}` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="mt-3 pt-2 flex items-center justify-center gap-1"
        style={{ borderTop: '1px solid #1e2a3a' }}
      >
        <span className="text-xs font-mono text-[#2a3a50]">POWERED BY</span>
        <span
          className="text-xs font-mono font-semibold"
          style={{ color: '#22d3ee' }}
        >
          VULTR
        </span>
        <span className="text-xs font-mono text-[#2a3a50]">+ GEMINI 2.5</span>
      </div>
    </div>
  );
}
