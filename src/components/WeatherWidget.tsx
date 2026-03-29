'use client';

import { useState } from 'react';
import type { WeatherData } from '@/types';
import { weatherEmojis, isSevere, degreesToCompass } from '@/lib/weather';

const FONT = 'var(--font-sans, sans-serif)';

function formatHour(timeStr: string): string {
  // timeStr: "2024-01-15T14:00" — extract hour
  const hour = parseInt(timeStr.slice(11, 13), 10);
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

interface WeatherWidgetProps {
  weather: WeatherData;
}

export default function WeatherWidget({ weather }: WeatherWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const severe = isSevere(weather.weatherCode);
  const compass = degreesToCompass(weather.windDirection);
  const emoji = weatherEmojis[weather.weatherCode] ?? '🌡️';

  return (
    <div
      style={{
        position: 'absolute',
        top: 68,
        left: 12,
        zIndex: 20,
        width: 224,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: severe
          ? '1px solid rgba(245,158,11,0.40)'
          : '1px solid rgba(255,255,255,0.20)',
        borderRadius: 14,
        padding: '10px 12px',
        boxShadow: severe
          ? '0 0 15px rgba(245,158,11,0.15)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        fontFamily: FONT,
        transition: 'border-color 300ms, box-shadow 300ms',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
        <span style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,0.90)', lineHeight: 1 }}>
          {weather.temperature}°F
        </span>
      </div>

      {/* Detail line */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', lineHeight: 1.4, marginBottom: 8 }}>
        Feels {weather.feelsLike}° · {compass} {weather.windSpeed}mph · {weather.humidity}% hum
        {weather.precipitation > 0 && ` · ${weather.precipitation}mm`}
      </div>

      {/* Forecast toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 9,
          letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.30)',
          textTransform: 'uppercase',
          fontFamily: FONT,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 8, display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}>▸</span>
        6-HOUR FORECAST
      </button>

      {/* Forecast grid */}
      {expanded && weather.hourlyForecast.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: `repeat(${weather.hourlyForecast.length}, 1fr)`,
            gap: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 8,
          }}
        >
          {/* Hour labels */}
          {weather.hourlyForecast.map((h, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.30)', marginBottom: 3 }}>
              {i === 0 ? 'Now' : formatHour(h.time)}
            </div>
          ))}
          {/* Emojis */}
          {weather.hourlyForecast.map((h, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 13, marginBottom: 3 }}>
              {weatherEmojis[h.weatherCode] ?? '🌡️'}
            </div>
          ))}
          {/* Temps */}
          {weather.hourlyForecast.map((h, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.40)', marginBottom: h.precipitationProbability > 30 ? 2 : 0 }}>
              {h.temperature}°
            </div>
          ))}
          {/* Precip bars */}
          {weather.hourlyForecast.some((h) => h.precipitationProbability > 30) &&
            weather.hourlyForecast.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                {h.precipitationProbability > 30 && (
                  <div
                    style={{
                      height: 2,
                      width: `${Math.round((h.precipitationProbability / 100) * 18)}px`,
                      background: 'rgba(59,130,246,0.5)',
                      borderRadius: 1,
                    }}
                  />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
