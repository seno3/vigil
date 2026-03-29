'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import ProfilePanel from '@/components/ui/ProfilePanel';

interface TopBarProps {
  user: User | null;
  is3D: boolean;
  onToggle3D: () => void;
  onLocate: () => void;
  onAuthOpen: () => void;
  onSignOut: () => void;
}

const FONT = 'var(--font-sans, sans-serif)';

export default function TopBar({ user, is3D, onToggle3D, onLocate, onAuthOpen, onSignOut }: TopBarProps) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const pill: React.CSSProperties = { borderRadius: '999px', padding: '4px 14px', fontSize: '11px', letterSpacing: '0.15em', fontFamily: FONT, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, height: '56px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <style>{`
        @keyframes topbarDotRing {
          from { transform: scale(1); opacity: 0.4; }
          to   { transform: scale(1.6); opacity: 0; }
        }
        .topbar-locate-tooltip {
          opacity: 0;
          pointer-events: none;
          transition: opacity 120ms ease;
        }
        .topbar-locate:hover .topbar-locate-tooltip {
          opacity: 1;
        }
      `}</style>

      <span
        onClick={() => router.push('/')}
        style={{ fontSize: '28px', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: 300, fontStyle: 'italic', letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', lineHeight: 1 }}
      >
        Vigil
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Blue location dot */}
        <div
          className="topbar-locate"
          onClick={onLocate}
          style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #3b82f6', opacity: 0.4, animation: 'topbarDotRing 1.5s ease-out infinite' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', display: 'block', flexShrink: 0 }} />
          <span
            className="topbar-locate-tooltip"
            style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.9)', fontSize: '11px', letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)', whiteSpace: 'nowrap', fontFamily: FONT }}
          >
            Current Location
          </span>
        </div>

        <button onClick={onToggle3D} style={pill}>{is3D ? '2D' : '3D'}</button>

        {user ? (
          <>
            {/* Avatar */}
            <div
              onClick={() => setPanelOpen(v => !v)}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#3b82f6',
                border: `1.5px solid ${avatarHover ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
                color: '#fff',
                fontFamily: FONT,
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
                flexShrink: 0,
              }}
            >
              {user.username[0].toUpperCase()}
            </div>

            {/* Profile panel */}
            {panelOpen && (
              <ProfilePanel
                user={user}
                onClose={() => setPanelOpen(false)}
                onSignOut={() => { setPanelOpen(false); onSignOut(); }}
              />
            )}
          </>
        ) : (
          <button onClick={onAuthOpen} style={pill}>SIGN IN</button>
        )}
      </div>
    </div>
  );
}
