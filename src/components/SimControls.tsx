'use client';

import { useState } from 'react';

interface SimControlsProps {
  efScale: number;
  windDirection: string;
  onEfChange: (ef: number) => void;
  onWindChange: (dir: string) => void;
  onSimulate: () => void;
  disabled: boolean;
  loading: boolean;
}

const EF_LABELS: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'EF1', color: '#fbbf24', desc: '86–110 mph' },
  2: { label: 'EF2', color: '#fb923c', desc: '111–135 mph' },
  3: { label: 'EF3', color: '#f05252', desc: '136–165 mph' },
  4: { label: 'EF4', color: '#dc2626', desc: '166–200 mph' },
  5: { label: 'EF5', color: '#991b1b', desc: '200+ mph' },
};

const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export default function SimControls({
  efScale,
  windDirection,
  onEfChange,
  onWindChange,
  onSimulate,
  disabled,
  loading,
}: SimControlsProps) {
  const ef = EF_LABELS[efScale];
  const [btnHover, setBtnHover] = useState(false);

  const canClick = !disabled && !loading;

  return (
    <div className="space-y-4">
      {/* EF Scale */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono tracking-widest" style={{ color: '#8fa8c0' }}>EF SCALE</span>
          <span className="text-xs font-mono" style={{ color: ef.color }}>
            {ef.label} · {ef.desc}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const meta     = EF_LABELS[n];
            const selected = efScale === n;
            return (
              <button
                key={n}
                onClick={() => onEfChange(n)}
                disabled={disabled}
                className="flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                style={{
                  background: selected ? meta.color : '#1a2235',
                  color:      selected ? '#fff' : '#8fa8c0',
                  border:     `1px solid ${selected ? meta.color : '#3a4f6a'}`,
                  boxShadow:  selected ? `0 0 10px ${meta.color}55` : 'none',
                  cursor:     disabled ? 'not-allowed' : 'pointer',
                }}
              >
                EF{n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wind Direction */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono tracking-widest" style={{ color: '#8fa8c0' }}>WIND DIRECTION</span>
          <span className="text-xs font-mono" style={{ color: '#f0f6ff' }}>
            MOVEMENT: {windDirection}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {WIND_DIRS.map((dir) => {
            const selected = windDirection === dir;
            return (
              <button
                key={dir}
                onClick={() => onWindChange(dir)}
                disabled={disabled}
                className="py-1 rounded text-xs font-mono transition-all"
                style={{
                  background: selected ? '#f0525222' : '#1a2235',
                  color:      selected ? '#f05252' : '#8fa8c0',
                  border:     `1px solid ${selected ? '#f0525266' : '#3a4f6a'}`,
                  cursor:     disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {dir}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulate Button */}
      <button
        onClick={onSimulate}
        disabled={!canClick}
        onMouseEnter={() => canClick && setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        className="simulate-button w-full rounded font-mono font-semibold relative overflow-hidden"
        style={{
          height:      '56px',
          fontSize:    '15px',
          letterSpacing: '0.15em',
          background:  !canClick
            ? '#1a2235'
            : 'linear-gradient(135deg, #dc2626, #f05252)',
          color:       !canClick ? '#4a6080' : '#fff',
          border:      `1px solid ${!canClick ? '#2a3a50' : 'transparent'}`,
          boxShadow:   !canClick
            ? 'none'
            : btnHover
            ? '0 4px 32px rgba(240,82,82,0.55)'
            : '0 4px 24px rgba(240,82,82,0.35)',
          transform:   btnHover && canClick ? 'translateY(-1px)' : 'none',
          cursor:      !canClick ? 'not-allowed' : 'pointer',
          transition:  'box-shadow 0.2s ease, transform 0.15s ease',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#4a6080', borderTopColor: 'transparent' }}
            />
            SIMULATING...
          </span>
        ) : (
          'SIMULATE STRIKE'
        )}
      </button>
    </div>
  );
}
