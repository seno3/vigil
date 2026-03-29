'use client';
import type { Emergency, EmergencyType, Tip } from '@/types';
import { useEffect, useState } from 'react';

const EMERGENCY_COLORS: Record<EmergencyType, string> = {
  shooting:   '#DC2626',
  tornado:    '#D97706',
  earthquake: '#EA580C',
  fire:       '#DC2626',
};

function credibilityColor(score: number): string {
  if (score >= 70) return '#4ade80';
  if (score >= 40) return '#facc15';
  return '#ef4444';
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

const STAGGER_DELAYS = [0, 100, 200, 300];

export default function EpicenterCluster({ emergency }: { emergency: Emergency }) {
  const color = EMERGENCY_COLORS[emergency.type];
  const [flares, setFlares] = useState<Tip[]>([]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/tips?lng=${emergency.lng}&lat=${emergency.lat}&radius=500`,
        );
        const data: Tip[] = await res.json();
        setFlares(data.slice(0, 4));
      } catch { /* silent */ }
    };

    poll();
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, [emergency.lng, emergency.lat]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      pointerEvents: 'none',
    }}>
      {/* Epicenter rings — visual approximation at screen center
          (geo-pinned Mapbox Marker would require map ref access) */}
      <div style={{ position: 'relative', width: '12px', height: '12px' }}>
        {[0, 0.7, 1.4].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '40px', height: '40px',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `2px solid ${color}99`,
            animation: `emergRingExpand 2s ease-out ${delay}s infinite`,
          }} />
        ))}
        {/* Inner dot */}
        <div style={{
          position: 'absolute',
          width: '12px', height: '12px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: color,
          border: '2px solid white',
        }} />
      </div>

      {/* Part B — Latest flare chips (hidden on mobile via CSS class) */}
      <div className="epicenter-chips" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
        {flares.map((tip, i) => (
          <div
            key={tip._id}
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '8px 14px',
              maxWidth: '280px',
              display: 'flex',
              alignItems: 'stretch',
              gap: '10px',
              opacity: 0,
              animation: `emergFadeIn 300ms ease-out ${STAGGER_DELAYS[i]}ms forwards`,
            }}
          >
            {/* Left accent bar */}
            <div style={{
              width: '2px',
              borderRadius: '2px',
              background: credibilityColor(tip.credibilityScore),
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {tip.buildingId ? `${truncate(tip.buildingId, 16)}  ·  ` : ''}
              {truncate(tip.description, 40)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
