import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getTipsByUser } from '@/lib/db/tips';

export async function GET(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tips = await getTipsByUser(userId);
  return NextResponse.json(tips);
}
