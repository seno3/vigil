'use client';
import { useEffect, useState } from 'react';
import { distanceMeters } from '@/lib/geo';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { Emergency } from '@/types';

const TWO_MILES_M = 3218.69;

export default function DistanceBanner({ emergency }: { emergency: Emergency }) {
  const userLoc = useUserLocation();
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoc) return;

    const compute = () => {
      const unit = (typeof localStorage !== 'undefined'
        ? localStorage.getItem('vigil_unit')
        : null) ?? 'mi';

      const meters = distanceMeters(userLoc.lat, userLoc.lng, emergency.lat, emergency.lng);

      if (meters <= TWO_MILES_M) {
        setDisplay(null);
        return;
      }

      if (unit === 'km') {
        setDisplay(`${(meters / 1000).toFixed(1)} km away`);
      } else {
        setDisplay(`${(meters / 1609.34).toFixed(1)} mi away`);
      }
    };

    compute();
    const id = setInterval(compute, 10_000);
    return () => clearInterval(id);
  }, [userLoc, emergency.lat, emergency.lng]);

  if (!display) return null;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '100px',
      padding: '8px 20px',
      fontFamily: '"Geist Mono", ui-monospace, monospace',
      fontSize: '11px',
      fontWeight: 400,
      color: 'rgba(255,255,255,0.5)',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {display}
    </div>
  );
}
