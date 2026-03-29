'use client';
import { useEffect, useRef, useState } from 'react';
import type { Emergency, Tip } from '@/types';
import CredibilityBadge from '@/components/CredibilityBadge';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function EmergencyFeed({ emergency }: { emergency: Emergency }) {
  const [flares, setFlares] = useState<Tip[]>([]);
  const knownIds = useRef(new Set<string>());
  const [newId, setNewId] = useState<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/tips?lng=${emergency.lng}&lat=${emergency.lat}&radius=500`,
        );
        const data: Tip[] = await res.json();
        setFlares(data.slice(0, 20));

        // detect new arrivals for slide-in animation
        for (const t of data) {
          if (!knownIds.current.has(t._id)) {
            knownIds.current.add(t._id);
            if (knownIds.current.size > 1) {
              setNewId(t._id);
              setTimeout(() => setNewId(null), 300);
            }
          }
        }
      } catch { /* silent */ }
    };

    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [emergency.lng, emergency.lat]);

  return (
    <div style={{
      width: '240px',
      maxHeight: '320px',
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
        }}>
          Live Flares
        </span>
      </div>

      {/* Scrollable list */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        scrollbarWidth: 'none',
      }}>
        {flares.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
            NO FLARES YET
          </div>
        )}
        {flares.map(tip => (
          <div
            key={tip._id}
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              animation: newId === tip._id ? 'emergSlideIn 200ms ease-out' : undefined,
            }}
          >
            {/* Row 1: credibility + building */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CredibilityBadge score={tip.credibilityScore} />
              {tip.buildingId && (
                <span style={{
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '120px',
                }}>
                  {truncate(tip.buildingId, 20)}
                </span>
              )}
            </div>

            {/* Row 2: message */}
            <div style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '11px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.45)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {tip.description}
            </div>

            {/* Row 3: time */}
            <div style={{
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: '9px',
              color: 'rgba(255,255,255,0.25)',
            }}>
              {timeAgo(tip.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
