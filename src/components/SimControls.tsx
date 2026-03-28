'use client';

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
  2: { label: 'EF2', color: '#f97316', desc: '111–135 mph' },
  3: { label: 'EF3', color: '#ef4444', desc: '136–165 mph' },
  4: { label: 'EF4', color: '#dc2626', desc: '166–200 mph' },
  5: { label: 'EF5', color: '#7f1d1d', desc: '200+ mph' },
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

  return (
    <div className="space-y-4">
      {/* EF Scale */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-[#556677] tracking-widest">EF SCALE</span>
          <span className="text-xs font-mono" style={{ color: ef.color }}>
            {ef.label} · {ef.desc}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const meta = EF_LABELS[n];
            const selected = efScale === n;
            return (
              <button
                key={n}
                onClick={() => onEfChange(n)}
                disabled={disabled}
                className="flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                style={{
                  background: selected ? meta.color : '#141926',
                  color: selected ? '#fff' : '#556677',
                  border: `1px solid ${selected ? meta.color : '#1e2a3a'}`,
                  boxShadow: selected ? `0 0 8px ${meta.color}66` : 'none',
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
          <span className="text-xs font-mono text-[#556677] tracking-widest">
            WIND DIRECTION
          </span>
          <span className="text-xs font-mono text-[#8899aa]">
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
                  background: selected ? '#ef444422' : '#141926',
                  color: selected ? '#ef4444' : '#556677',
                  border: `1px solid ${selected ? '#ef444466' : '#1e2a3a'}`,
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
        disabled={disabled || loading}
        className="w-full py-3 rounded font-mono font-semibold text-sm tracking-widest transition-all relative overflow-hidden"
        style={{
          background: disabled || loading ? '#2a3a50' : '#ef4444',
          color: disabled || loading ? '#556677' : '#fff',
          border: `1px solid ${disabled || loading ? '#1e2a3a' : '#ef4444'}`,
          boxShadow: disabled || loading ? 'none' : '0 0 20px rgba(239,68,68,0.4)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#556677', borderTopColor: 'transparent' }}
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
