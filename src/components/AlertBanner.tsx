'use client';
import { useState, useEffect } from 'react';

interface AlertBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function AlertBanner({ message, onDismiss }: AlertBannerProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 60000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(239,68,68,0.4)',
      padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'ui-monospace, monospace',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'pulse 1s infinite' }} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{message}</span>
      </div>
      <button onClick={onDismiss} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
    </div>
  );
}
