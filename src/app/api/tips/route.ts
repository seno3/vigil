import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createTip, getTipsInArea } from '@/lib/db/tips';
import { findById } from '@/lib/db/users';
import { processTip } from '@/lib/agents/orchestrator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lng = parseFloat(searchParams.get('lng') ?? '0');
  const lat = parseFloat(searchParams.get('lat') ?? '0');
  const radius = parseFloat(searchParams.get('radius') ?? '1609');
  const tips = await getTipsInArea(lng, lat, radius);
  return NextResponse.json(tips);
}

export async function POST(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { lng, lat, buildingId, category, description, urgency } = body;

  const user = await findById(userId);
  const credibilityScore = user?.credibilityScore ?? 50;

  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

  const tip = await createTip({
    userId,
    location: [lng, lat],
    buildingId,
    category,
    description,
    urgency: urgency ?? 'medium',
    credibilityScore,
    expiresAt,
  });

  // Process async — don't block the response
  processTip(tip).catch(console.error);

  return NextResponse.json(tip, { status: 201 });
}
