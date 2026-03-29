import type { NewsArticle } from '@/types';

function categorizeArticle(text: string): NewsArticle['relevanceCategory'] {
  const lower = text.toLowerCase();
  if (/shooting|shooter|gunshot|armed|weapon|stabbing|attack/.test(lower)) return 'emergency';
  if (/fire|explosion|hazmat|chemical|gas leak/.test(lower)) return 'safety';
  if (/tornado|storm|flood|hurricane|blizzard|severe weather/.test(lower)) return 'weather';
  if (/power outage|road closure|construction|water main|building collapse/.test(lower)) return 'infrastructure';
  return 'general';
}

async function getLocationName(lat: number, lng: number): Promise<string> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return 'local';
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=place,locality&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features?.[0]?.text as string | undefined) ?? 'local';
  } catch {
    return 'local';
  }
}

export async function getLocalNews(lat: number, lng: number, locationName?: string): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const name = locationName?.trim() || await getLocationName(lat, lng);
  if (name === 'local') return [];

  const weatherQuery = encodeURIComponent(`${name} (tornado OR storm OR flood OR hurricane OR blizzard OR "severe weather" OR "weather warning")`);

  const weatherRes = await fetch(`https://gnews.io/api/v4/search?q=${weatherQuery}&lang=en&max=8&apikey=${apiKey}`).then((r) => r.json()).catch(() => null);

  const articles: NewsArticle[] = [];

  for (const article of (weatherRes?.articles ?? [])) {
    articles.push({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source?.name ?? 'Unknown',
      publishedAt: article.publishedAt,
      imageUrl: article.image,
      relevanceCategory: 'weather',
    });
  }

  return articles.slice(0, 8);
}
