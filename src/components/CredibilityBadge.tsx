'use client';
export default function CredibilityBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#ef4444';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '999px', fontSize: '10px',
      fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em',
      background: `${color}20`, border: `1px solid ${color}40`, color,
    }}>
      {score}
    </span>
  );
}
