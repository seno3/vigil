'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/types';

interface ProfilePanelProps {
  user: User;
  onClose: () => void;
  onSignOut: () => void;
}

const FONT = 'var(--font-sans, sans-serif)';
const UNIT_KEY = 'vigil_unit';

function useUnit() {
  const [unit, setUnit] = useState<'mi' | 'km'>('mi');
  useEffect(() => {
    const stored = localStorage.getItem(UNIT_KEY);
    if (stored === 'km' || stored === 'mi') setUnit(stored);
  }, []);
  const toggle = () => {
    const next = unit === 'mi' ? 'km' : 'mi';
    setUnit(next);
    localStorage.setItem(UNIT_KEY, next);
  };
  return { unit, toggle };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBell() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx={12} cy={9} r={2.5} />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={16} x2={12} y2={12} />
      <line x1={12} y1={8} x2={12} y2={8} strokeWidth={2} />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.7)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  labelColor = 'rgba(255,255,255,0.75)',
  hoverBg = 'rgba(255,255,255,0.06)',
  right,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  hoverBg?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        borderRadius: 10,
        cursor: onClick ? 'pointer' : 'default',
        background: hover && onClick ? hoverBg : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      {icon}
      <span style={{ flex: 1, fontFamily: FONT, fontSize: 13, fontWeight: 400, color: labelColor }}>
        {label}
      </span>
      {right}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ProfilePanel({ user, onClose, onSignOut }: ProfilePanelProps) {
  const { unit, toggle } = useUnit();
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => { onClose(); }, 140);
  };

  const handleSignOut = () => {
    document.cookie = 'vigil_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    close();
    setTimeout(() => onSignOut(), 140);
  };

  const initial = user.username[0].toUpperCase();

  return (
    <>
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, zIndex: 49 }}
      />

      {/* Panel */}
      <div
        className="vigil-profile-panel"
        style={{
          position: 'fixed',
          top: 56,
          right: 16,
          width: 260,
          zIndex: 50,
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          animation: `${closing ? 'panelOut 140ms ease-in' : 'panelIn 180ms ease-out'} both`,
        }}
      >
        {/* Section 1 — Identity */}
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 500, color: '#fff', fontFamily: FONT, marginBottom: 12 }}>
            {initial}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            {user.username}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Credibility score: {user.credibilityScore}
          </div>
        </div>

        {/* Section 2 — Settings */}
        <div style={{ padding: 8 }}>
          <Row icon={<IconBell />} label="Notifications" />
          <Row
            icon={<IconMapPin />}
            label="Preferred units"
            onClick={toggle}
            right={
              <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: 'rgba(255,255,255,0.4)' }}>
                {unit}
              </span>
            }
          />
          <Row icon={<IconShield />} label="Privacy" />
          <Row icon={<IconInfo />} label="About Vigil" />
        </div>

        {/* Section 3 — Sign out */}
        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Row
            icon={<IconSignOut />}
            label="Sign out"
            labelColor="rgba(239,68,68,0.8)"
            hoverBg="rgba(239,68,68,0.08)"
            onClick={handleSignOut}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 400px) {
          .vigil-profile-panel { right: 8px !important; left: 8px !important; width: auto !important; }
        }
      `}</style>
    </>
  );
}
