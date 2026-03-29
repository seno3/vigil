'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Tip, TipCategory, User } from '@/types';
import CredibilityBadge from './CredibilityBadge';

interface NotificationFeedProps {
  lng: number;
  lat: number;
  radius: number;
  user: User | null;
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

export default function NotificationFeed({ lng, lat, radius, user }: NotificationFeedProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState<TipCategory | 'all'>('all');
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  const loadTips = useCallback(() => {
    fetch(`/api/tips?lng=${lng}&lat=${lat}&radius=${radius}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setTips)
      .catch(console.error);
  }, [lng, lat, radius]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  const handleUpvote = async (tipId: string) => {
    if (!user || upvotingId) return;
    setUpvotingId(tipId);
    try {
      const res = await fetch(`/api/tips/${tipId}/upvote`, { method: 'POST', credentials: 'include' });
      const text = await res.text();
      let body: { credibilityScore?: number; upvoteCount?: number; already?: boolean; error?: string } = {};
      if (text) {
        try {
          body = JSON.parse(text) as typeof body;
        } catch {
          setUpvotingId(null);
          return;
        }
      }
      if (!res.ok) {
        setUpvotingId(null);
        return;
      }
      setTips((prev) =>
        prev.map((t) =>
          t._id === tipId
            ? {
                ...t,
                credibilityScore: body.credibilityScore ?? t.credibilityScore,
                upvoteCount: body.upvoteCount ?? t.upvoteCount ?? 0,
                hasUpvoted: true,
              }
            : t,
        ),
      );
    } finally {
      setUpvotingId(null);
    }
  };

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(tip.createdAt)}</span>
                  <CredibilityBadge score={tip.credibilityScore} />
                </div>
                {user && String(tip.userId) !== user._id && (
                  <button
                    type="button"
                    disabled={upvotingId === tip._id || tip.hasUpvoted}
                    onClick={() => handleUpvote(tip._id)}
                    title={tip.hasUpvoted ? 'You supported this flare' : 'Upvote to raise credibility'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      fontFamily: 'inherit',
                      textTransform: 'uppercase',
                      cursor: tip.hasUpvoted || upvotingId === tip._id ? 'default' : 'pointer',
                      background: tip.hasUpvoted ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${tip.hasUpvoted ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.12)'}`,
                      color: tip.hasUpvoted ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                      opacity: upvotingId === tip._id ? 0.6 : 1,
                    }}
                  >
                    <span aria-hidden>▲</span>
                    {tip.upvoteCount !== undefined && tip.upvoteCount > 0 ? tip.upvoteCount : 'Upvote'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
