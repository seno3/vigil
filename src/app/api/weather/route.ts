import { NextRequest, NextResponse } from 'next/server';
import { getWeather, isSevere, degreesToCompass } from '@/lib/weather';
import { getTipsInArea, createTip } from '@/lib/db/tips';
import { getOrCreateSystemUser } from '@/lib/db/users';
import type { WeatherData } from '@/types';
import type { TipUrgency } from '@/types';

const cache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const key = getCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const weather = await getWeather(lat, lng);
    cache.set(key, { data: weather, timestamp: Date.now() });

    if (isSevere(weather.weatherCode)) {
      autoCreateWeatherTip(lng, lat, weather).catch(console.error);
    }

    return NextResponse.json(weather);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}

async function autoCreateWeatherTip(lng: number, lat: number, weather: WeatherData) {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const nearby = await getTipsInArea(lng, lat, 500, thirtyMinAgo);

  const systemUser = await getOrCreateSystemUser();
  const systemUserId = String(systemUser._id);

  const hasWeatherTip = nearby.some(
    (t) => t.category === 'weather' && String(t.userId) === systemUserId,
  );
  if (hasWeatherTip) return;

  const compass = degreesToCompass(weather.windDirection);
  const urgency: TipUrgency = weather.weatherCode >= 95 ? 'critical' : 'high';

  await createTip({
    userId: systemUserId,
    location: [lng, lat],
    category: 'weather',
    description: `⚠️ ${weather.weatherDescription} — ${weather.temperature}°F, winds ${compass} at ${weather.windSpeed}mph. ${weather.precipitation}mm precipitation.`,
    urgency,
    credibilityScore: 80,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
}
