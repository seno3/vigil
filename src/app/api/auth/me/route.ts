import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { findById } from '@/lib/db/users';

export async function GET(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await findById(userId);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ _id: String(user._id), username: user.username, credibilityScore: user.credibilityScore, tipsSubmitted: user.tipsSubmitted, tipsCorroborated: user.tipsCorroborated });
}
