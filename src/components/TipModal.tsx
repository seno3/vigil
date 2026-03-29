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

const URGENCY_COLORS: Record<TipUrgency, string> = {
  low:      '#22C55E',
  medium:   '#EAB308',
  high:     '#F97316',
  critical: '#DC2626',
};

const URGENCY_COLORS_RGB: Record<TipUrgency, string> = {
  low:      '34,197,94',
  medium:   '234,179,8',
  high:     '249,115,22',
  critical: '220,38,38',
};

function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `(${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir})`;
}

export default function TipModal({ lng, lat, buildingId, onClose, onSubmit }: TipModalProps) {
  const [category, setCategory] = useState<TipCategory>('general_safety');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<TipUrgency>('medium');
  const [loading, setLoading] = useState(false);
  const [hoveredUrgency, setHoveredUrgency] = useState<TipUrgency | null>(null);
  const [submitHovered, setSubmitHovered] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    await onSubmit({ category, description, urgency });
    setLoading(false);
    onClose();
  };

  const urgencyButtonStyle = (u: TipUrgency): React.CSSProperties => {
    const rgb = URGENCY_COLORS_RGB[u];
    const color = URGENCY_COLORS[u];
    const selected = urgency === u;
    const hovered = hoveredUrgency === u && !selected;

    if (selected) {
      return {
        flex: 1, padding: '6px 0', borderRadius: '6px', fontSize: '10px',
        letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer',
        textTransform: 'uppercase', transition: 'all 120ms ease',
        background: `rgba(${rgb},0.15)`,
        border: `1px solid rgba(${rgb},0.6)`,
        color,
        fontWeight: 500,
      };
    }
    return {
      flex: 1, padding: '6px 0', borderRadius: '6px', fontSize: '10px',
      letterSpacing: '0.1em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer',
      textTransform: 'uppercase', transition: 'all 120ms ease',
      background: hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.4)',
    };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'inherit', marginBottom: '4px' }}>
            Send a Flare
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: '"Geist Mono", ui-monospace, monospace', letterSpacing: '0.04em' }}>
            {formatCoords(lat, lng)}{buildingId ? ` · ${buildingId}` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '10px', letterSpacing: '0.15em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: category === c.value ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${category === c.value ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, color: category === c.value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}>{c.label}</button>
          ))}
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you're observing..." rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', marginBottom: '20px' }}>
          {(['low', 'medium', 'high', 'critical'] as TipUrgency[]).map(u => (
            <button
              key={u}
              onClick={() => setUrgency(u)}
              onMouseEnter={() => setHoveredUrgency(u)}
              onMouseLeave={() => setHoveredUrgency(null)}
              style={urgencyButtonStyle(u)}
            >
              {u}
            </button>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading || !description.trim()} onMouseEnter={() => setSubmitHovered(true)} onMouseLeave={() => setSubmitHovered(false)} style={{ width: '100%', padding: '12px', borderRadius: '999px', fontSize: '12px', letterSpacing: '0.2em', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: submitHovered ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.12)', border: `1px solid ${submitHovered ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.25)'}`, color: submitHovered ? '#DC2626' : 'rgba(255,255,255,0.8)', textTransform: 'uppercase', opacity: loading || !description.trim() ? 0.5 : 1, transition: 'all 120ms ease' }}>
          {loading ? 'SUBMITTING...' : 'SUBMIT FLARE'}
        </button>
      </div>
    </div>
  );
}
