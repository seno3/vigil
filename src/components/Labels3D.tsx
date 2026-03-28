'use client';

import { Html } from '@react-three/drei';
import { Label } from '@/types';
import { latLngToLocal } from '@/lib/geo';

interface Labels3DProps {
  labels: Label[];
  centerLat: number;
  centerLng: number;
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: '#ef4444',
  warning: '#ff6b2b',
  info: '#22d3ee',
  safe: '#4ade80',
};

export default function Labels3D({ labels, centerLat, centerLng }: Labels3DProps) {
  return (
    <group name="labels">
      {labels.map((label) => {
        const [x, z] = latLngToLocal(
          label.position.lat,
          label.position.lng,
          centerLat,
          centerLng
        );
        const borderColor = SEVERITY_BORDER[label.severity] ?? '#22d3ee';

        return (
          <Html
            key={label.id}
            position={[x, 80, z]}
            center
            distanceFactor={600}
            zIndexRange={[0, 10]}
          >
            <div
              className="agent-label"
              style={{
                background: 'rgba(10,14,23,0.88)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderLeft: `3px solid ${borderColor}`,
                color: '#f0f4f8',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                maxWidth: '180px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                backdropFilter: 'blur(4px)',
              }}
            >
              {label.text}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
