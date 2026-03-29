'use client';
import { useState } from 'react';
import type { TipCategory, TipUrgency } from '@/types';

interface TipModalProps {
  lng: number;
  lat: number;
  buildingId?: string;
  onClose: () => void;
  onSubmit: (data: { category: TipCategory; description: string; urgency: TipUrgency }) => Promise<void>;
}

const CATEGORIES: { value: TipCategory; label: string }[] = [
  { value: 'active_threat', label: 'ACTIVE THREAT' },
  { value: 'weather', label: 'WEATHER' },
  { value: 'infrastructure', label: 'INFRASTRUCTURE' },
  { value: 'general_safety', label: 'GENERAL SAFETY' },
];

export default function TipModal({ lng, lat, buildingId, onClose, onSubmit }: TipModalProps) {
  const [category, setCategory] = useState<TipCategory>('general_safety');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<TipUrgency>('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    await onSubmit({ category, description, urgency });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', fontFamily: 'ui-monospace, monospace', marginBottom: '20px' }}>
          REPORT TIP — {lat.toFixed(4)}, {lng.toFixed(4)}{buildingId ? ' · BUILDING' : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '10px', letterSpacing: '0.15em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: category === c.value ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${category === c.value ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, color: category === c.value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}>{c.label}</button>
          ))}
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you're observing..." rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', marginBottom: '20px' }}>
          {(['low', 'medium', 'high', 'critical'] as TipUrgency[]).map(u => (
            <button key={u} onClick={() => setUrgency(u)} style={{ flex: 1, padding: '6px 0', borderRadius: '6px', fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: urgency === u ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${urgency === u ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: urgency === u ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{u}</button>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={loading || !description.trim()} style={{ width: '100%', padding: '12px', borderRadius: '999px', fontSize: '12px', letterSpacing: '0.2em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', opacity: loading || !description.trim() ? 0.5 : 1 }}>
          {loading ? 'SUBMITTING...' : 'SUBMIT TIP'}
        </button>
      </div>
    </div>
  );
}
