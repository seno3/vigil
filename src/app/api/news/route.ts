import { NextRequest, NextResponse } from 'next/server';
import { getLocalNews } from '@/lib/news';
import type { NewsArticle } from '@/types';

const cache = new Map<string, { data: NewsArticle[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const locationName = searchParams.get('locationName') ?? '';

  if (!isFinite(lat) || !isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const key = getCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const articles = await getLocalNews(lat, lng, locationName);
    cache.set(key, { data: articles, timestamp: Date.now() });
    return NextResponse.json(articles);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
