'use client';
import { useState, useEffect } from 'react';
import type { Tip, TipCategory } from '@/types';
import CredibilityBadge from './CredibilityBadge';

interface NotificationFeedProps {
  lng: number;
  lat: number;
  radius: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  active_threat: '#ef4444',
  weather: '#3b82f6',
  infrastructure: '#f59e0b',
  general_safety: '#22c55e',
};

const FILTER_TABS: Array<{ label: string; value: TipCategory | 'all' }> = [
  { label: 'ALL', value: 'all' },
  { label: 'THREATS', value: 'active_threat' },
  { label: 'INFRA', value: 'infrastructure' },
  { label: 'WEATHER', value: 'weather' },
  { label: 'SAFETY', value: 'general_safety' },
];

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function NotificationFeed({ lng, lat, radius }: NotificationFeedProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState<TipCategory | 'all'>('all');

  useEffect(() => {
    fetch(`/api/tips?lng=${lng}&lat=${lat}&radius=${radius}`)
      .then(r => r.json()).then(setTips).catch(console.error);
  }, [lng, lat, radius]);

  const filtered = filter === 'all' ? tips : tips.filter(t => t.category === filter);

  return (
    <div style={{ width: '320px', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans, sans-serif)' }}>
      <div style={{ padding: '16px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.25em', marginBottom: '12px' }}>LIVE FEED</div>
        <div style={{ display: 'flex', gap: '4px', paddingBottom: '12px', overflowX: 'auto' }}>
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)} style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '9px', letterSpacing: '0.1em', cursor: 'pointer', whiteSpace: 'nowrap', background: filter === tab.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === tab.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: filter === tab.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>{tab.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {filtered.length === 0 && <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>NO FLARES IN AREA</div>}
        {filtered.map(tip => {
          const color = SEVERITY_COLORS[tip.category] ?? '#888';
          const isCritical = tip.urgency === 'critical' || tip.category === 'active_threat';
          return (
            <div key={tip._id} style={{ marginBottom: '6px', padding: '10px 12px', borderRadius: '8px', background: isCritical ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCritical ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: '4px', textTransform: 'uppercase' }}>{tip.category.replace('_', ' ')}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{tip.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(tip.createdAt)}</span>
                <CredibilityBadge score={tip.credibilityScore} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
