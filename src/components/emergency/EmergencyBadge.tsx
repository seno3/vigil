'use client';
import type { Emergency, EmergencyType } from '@/types';

const EMERGENCY_COLORS: Record<EmergencyType, string> = {
  shooting:   '#DC2626',
  tornado:    '#D97706',
  earthquake: '#EA580C',
  fire:       '#DC2626',
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function EmergencyBadge({ emergency }: { emergency: Emergency }) {
  const color = EMERGENCY_COLORS[emergency.type];

  return (
    <div style={{
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${color}80`,
      borderRadius: '14px',
      padding: '12px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      pointerEvents: 'auto',
    }}>
      {/* Row 1: dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: color, flexShrink: 0,
          animation: 'emergDotPulse 1.8s ease-out infinite',
          display: 'inline-block',
        }} />
        <span style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
        }}>
          Active Emergency
        </span>
      </div>

      {/* Row 2: type */}
      <div style={{
        fontFamily: 'var(--font-sans, sans-serif)',
        fontSize: '22px',
        fontWeight: 300,
        color: '#ffffff',
        lineHeight: 1.1,
      }}>
        {capitalize(emergency.type)}
      </div>

      {/* Row 3: address */}
      {emergency.address && (
        <div style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '11px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.4)',
        }}>
          {truncate(emergency.address, 28)}
        </div>
      )}
    </div>
  );
}
