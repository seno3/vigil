'use client';
import type { User } from '@/types';

interface TopBarProps {
  user: User | null;
  is3D: boolean;
  radius: number;
  onToggle3D: () => void;
  onRadiusChange: (r: number) => void;
  onLocate: () => void;
  onAuthOpen: () => void;
}

export default function TopBar({ user, is3D, radius, onToggle3D, onRadiusChange, onLocate, onAuthOpen }: TopBarProps) {
  const pill: React.CSSProperties = { borderRadius: '999px', padding: '4px 14px', fontSize: '11px', letterSpacing: '0.15em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' };
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, height: '56px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ fontSize: '12px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.7)', fontFamily: 'ui-monospace, monospace' }}>VIGIL</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={onLocate} style={pill}>⊕</button>
        <button onClick={onToggle3D} style={{ ...pill, background: is3D ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)', color: is3D ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}>3D</button>
        <select value={radius} onChange={e => onRadiusChange(Number(e.target.value))} style={{ ...pill, appearance: 'none' as const }}>
          <option value={804}>0.5MI</option>
          <option value={1609}>1MI</option>
          <option value={3218}>2MI</option>
          <option value={8046}>5MI</option>
        </select>
        {user ? (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}>
            {user.username[0].toUpperCase()}
          </div>
        ) : (
          <button onClick={onAuthOpen} style={pill}>SIGN IN</button>
        )}
      </div>
    </div>
  );
}
