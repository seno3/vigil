'use client';
import { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onAuth: (user: { _id: string; username: string; credibilityScore: number }) => void;
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

export default function AuthModal({ onClose, onAuth }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    const res = await fetch(tab === 'login' ? '/api/auth/login' : '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Error'); return; }
    onAuth(data);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '28px', width: '360px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {(['login', 'signup'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.2em', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: tab === t ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', borderBottom: tab === t ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent', paddingBottom: '4px' }}>
              {t === 'login' ? 'SIGN IN' : 'SIGN UP'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={inputStyle} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          {error && <div style={{ fontSize: '11px', color: '#ef4444' }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ marginTop: '8px', padding: '11px', borderRadius: '999px', fontSize: '12px', letterSpacing: '0.2em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', opacity: loading ? 0.5 : 1 }}>
            {loading ? '...' : tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </div>
      </div>
    </div>
  );
}
