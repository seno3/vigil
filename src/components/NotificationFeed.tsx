'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Tip, TipCategory, User, NewsArticle } from '@/types';
import { formatFlareRadiusShort } from '@/lib/flareRadius';
import { VIGIL_FLARES_CHANGED_EVENT } from '@/lib/flareSync';
import { usePreferredUnit } from '@/hooks/usePreferredUnit';
import { useUserLocation } from '@/hooks/useUserLocation';
import CredibilityBadge from './CredibilityBadge';
import ProfilePanel from '@/components/ui/ProfilePanel';
import AnalysisReceipt from './AnalysisReceipt';

interface NotificationFeedProps {
  lng: number;
  lat: number;
  radius: number;
  user: User | null;
  is3D: boolean;
  onToggle3D: () => void;
  onLocate: () => void;
  onAuthOpen: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  news?: NewsArticle[];
  showNews?: boolean;
}

const FONT = 'var(--font-sans, sans-serif)';
const pill: React.CSSProperties = {
  borderRadius: '999px',
  padding: '4px 12px',
  fontSize: '10px',
  letterSpacing: '0.12em',
  fontFamily: FONT,
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.65)',
  textTransform: 'uppercase',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)',
};

const SEVERITY_COLORS: Record<string, string> = {
  active_threat: '#ef4444',
  weather: '#3b82f6',
  infrastructure: '#f59e0b',
  general_safety: '#22c55e',
};

type FeedFilter = TipCategory | 'all' | 'news';

const FILTER_TABS_BASE: Array<{ label: string; value: FeedFilter }> = [
  { label: 'ALL', value: 'all' },
  { label: 'THREATS', value: 'active_threat' },
  { label: 'INFRA', value: 'infrastructure' },
  { label: 'WEATHER', value: 'weather' },
  { label: 'SAFETY', value: 'general_safety' },
  { label: 'NEWS', value: 'news' },
];

const NEWS_CATEGORY_COLORS: Record<string, string> = {
  emergency: '#ef4444',
  safety: '#f97316',
  weather: '#f59e0b',
  infrastructure: '#3b82f6',
};

function newsTimeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(meters: number, unit: 'mi' | 'km'): string {
  if (unit === 'km') {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')} km`;
    return `${Math.round(meters)} m`;
  }
  const mi = meters / 1609.344;
  if (mi < 0.1) return `${Math.round(meters * 3.281)} ft`;
  return `${mi < 10 ? mi.toFixed(1).replace(/\.0$/, '') : Math.round(mi)} mi`;
}

export default function NotificationFeed({
  lng,
  lat,
  radius,
  user,
  is3D,
  onToggle3D,
  onLocate,
  onAuthOpen,
  onSignOut,
  onOpenSettings,
  news = [],
  showNews = true,
}: NotificationFeedProps) {
  const { unit } = usePreferredUnit();
  const userLoc = useUserLocation();
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [upvotingId, setUpvotingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const loadTips = useCallback(() => {
    fetch(`/api/tips?lng=${lng}&lat=${lat}&radius=${radius}`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setTips)
      .catch(console.error);
  }, [lng, lat, radius]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  useEffect(() => {
    const onFlaresChanged = () => loadTips();
    window.addEventListener(VIGIL_FLARES_CHANGED_EVENT, onFlaresChanged);
    return () => window.removeEventListener(VIGIL_FLARES_CHANGED_EVENT, onFlaresChanged);
  }, [loadTips]);

  const handleAnalyze = async (tipId: string) => {
    if (analyzingId) return;
    setAnalyzingId(tipId);
    await fetch(`/api/tips/${tipId}/analyze`, { method: 'POST', credentials: 'include' }).catch(console.error);
    setAnalyzingId(null);
  };

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

  const FILTER_TABS = showNews ? FILTER_TABS_BASE : FILTER_TABS_BASE.filter((t) => t.value !== 'news');
  // If news tab is hidden but currently selected, reset to 'all'
  const activeFilter = (!showNews && filter === 'news') ? 'all' : filter;

  const filtered = activeFilter === 'all' ? tips : activeFilter === 'news' ? [] : tips.filter((t) => t.category === activeFilter);

  // For 'all' tab: interleave news by time
  type FeedItem = { type: 'tip'; data: Tip } | { type: 'news'; data: NewsArticle };
  let feedItems: FeedItem[] = [];
  if (activeFilter === 'all' && showNews && news.length > 0) {
    const tipItems: FeedItem[] = tips.map((t) => ({ type: 'tip', data: t }));
    const newsItems: FeedItem[] = news.map((a) => ({ type: 'news', data: a }));
    feedItems = [...tipItems, ...newsItems].sort((a, b) => {
      const ta = a.type === 'tip' ? new Date(a.data.createdAt).getTime() : new Date((a.data as NewsArticle).publishedAt).getTime();
      const tb = b.type === 'tip' ? new Date(b.data.createdAt).getTime() : new Date((b.data as NewsArticle).publishedAt).getTime();
      return tb - ta;
    });
  } else if (activeFilter === 'news') {
    feedItems = news.map((a) => ({ type: 'news', data: a }));
  } else {
    feedItems = filtered.map((t) => ({ type: 'tip', data: t }));
  }

  const filterButton = (tab: (typeof FILTER_TABS_BASE)[number]) => (
    <button
      key={tab.value}
      type="button"
      onClick={() => setFilter(tab.value)}
      style={{
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '9px',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        background: activeFilter === tab.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${activeFilter === tab.value ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.22)'}`,
        color: activeFilter === tab.value ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)',
      }}
    >
      {tab.label}
    </button>
  );

  return (
    <div
      style={{
        width: 'min(300px, 100%)',
        flexShrink: 0,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.25)',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes feedLocateRing {
          from { transform: scale(1); opacity: 0.4; }
          to   { transform: scale(1.6); opacity: 0; }
        }
        .feed-locate-tooltip {
          opacity: 0;
          pointer-events: none;
          transition: opacity 120ms ease;
        }
        .feed-locate:hover .feed-locate-tooltip { opacity: 1; }
      `}</style>

      {/* Map actions — spaced across bar, inset from edges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
          padding: '12px 22px 10px',
          boxSizing: 'border-box',
          flexShrink: 0,
          borderBottom: '2px solid rgba(255,255,255,0.14)',
        }}
      >
        <div
          className="feed-locate"
          onClick={onLocate}
          style={{
            position: 'relative',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1.5px solid #3b82f6',
              opacity: 0.4,
              animation: 'feedLocateRing 1.5s ease-out infinite',
            }}
          />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'block', flexShrink: 0 }} />
          <span
            className="feed-locate-tooltip"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.75)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: 10,
              letterSpacing: '0.05em',
              padding: '4px 8px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.12)',
              whiteSpace: 'nowrap',
              fontFamily: FONT,
              zIndex: 5,
            }}
          >
            Location
          </span>
        </div>

        <button type="button" onClick={onToggle3D} style={pill}>
          {is3D ? '2D' : '3D'}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings — flare distance"
          aria-label="Open settings"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: 15,
            lineHeight: 1,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          ⚙
        </button>

        {user ? (
          <div
            onClick={() => setPanelOpen((v) => !v)}
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
        ) : (
          <button type="button" onClick={onAuthOpen} style={{ ...pill, padding: '4px 10px' }}>
            Sign in
          </button>
        )}
      </div>

      {user && panelOpen && (
        <ProfilePanel user={user} onClose={() => setPanelOpen(false)} onSignOut={() => { setPanelOpen(false); onSignOut(); }} />
      )}

      <div style={{ padding: '16px 16px 0', borderBottom: '2px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
            width: '100%',
            marginBottom: 12,
          }}
        >
          <div style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: 400, fontSize: '20px', color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.01em' }}>
            Live Feed
          </div>
          <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Within {formatFlareRadiusShort(radius, unit)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', paddingBottom: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px 6px',
              width: '100%',
              justifyItems: 'center',
            }}
          >
            {FILTER_TABS.slice(0, 3).map(filterButton)}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${FILTER_TABS.slice(3).length}, 1fr)`,
              gap: '8px 6px',
              width: '100%',
              justifyItems: 'center',
            }}
          >
            {FILTER_TABS.slice(3).map(filterButton)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {feedItems.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            {activeFilter === 'news' ? 'NO LOCAL NEWS' : 'NO FLARES IN AREA'}
          </div>
        )}
        {feedItems.map((item, idx) => {
          if (item.type === 'news') {
            const article = item.data as NewsArticle;
            const cat = article.relevanceCategory ?? 'general';
            const catColor = NEWS_CATEGORY_COLORS[cat];
            const isUrgent = cat === 'emergency' || cat === 'safety';
            return (
              <div
                key={`news-${article.url}-${idx}`}
                style={{
                  marginBottom: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isUrgent ? (cat === 'emergency' ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)') : 'rgba(255,255,255,0.08)'}`,
                  borderLeft: isUrgent ? `2px solid ${catColor}55` : undefined,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 5 }}>
                  📰 Local News
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.70)',
                    fontWeight: 500,
                    marginBottom: 6,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {article.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap' }}>
                      {article.source} · {newsTimeAgo(article.publishedAt)}
                    </span>
                    {catColor && cat !== 'general' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: catColor, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: catColor, display: 'inline-block' }} />
                        {cat}
                      </span>
                    )}
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.20)', textDecoration: 'none', flexShrink: 0 }}
                    title="Open article"
                  >
                    🔗
                  </a>
                </div>
              </div>
            );
          }

          const tip = item.data as Tip;
          const color = SEVERITY_COLORS[tip.category] ?? '#888';
          const ringGradient = `linear-gradient(90deg, ${color} 0%, ${color}cc 12%, ${color}55 38%, ${color}1a 68%, transparent 100%)`;
          return (
            <div
              key={tip._id}
              style={{
                marginBottom: 8,
                padding: 2,
                borderRadius: 10,
                background: ringGradient,
              }}
            >
              <div
                style={{
                  borderRadius: 8,
                  padding: '12px 15px',
                  background: '#141420',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {tip.category.replace('_', ' ')}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '6px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {tip.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.03em' }}>
                      {timeAgo(tip.createdAt)}
                      {userLoc && (
                        <>
                          {' · '}
                          {formatDist(
                            haversineM(
                              userLoc.lat, userLoc.lng,
                              tip.location.coordinates[1], tip.location.coordinates[0],
                            ),
                            unit,
                          )}
                        </>
                      )}
                    </span>
                    <CredibilityBadge score={tip.credibilityScore} />
                  </div>
                  <button
                    type="button"
                    disabled={analyzingId === tip._id}
                    onClick={() => handleAnalyze(tip._id)}
                    title="Re-run AI analysis"
                    style={{
                      padding: '3px 7px',
                      borderRadius: '999px',
                      fontSize: '9px',
                      letterSpacing: '0.1em',
                      fontFamily: 'inherit',
                      cursor: analyzingId === tip._id ? 'default' : 'pointer',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: analyzingId === tip._id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
                      opacity: analyzingId === tip._id ? 0.6 : 1,
                    }}
                  >
                    {analyzingId === tip._id ? '···' : '⟳ AI'}
                  </button>
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
                <AnalysisReceipt tip={tip} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
