import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { upvoteTip } from '@/lib/db/tips';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(_req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to upvote flares' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await upvoteTip(id, userId);
    if (!result.ok) {
      if (result.reason === 'own_tip') {
        return NextResponse.json({ error: "You can't upvote your own flare" }, { status: 400 });
      }
      return NextResponse.json({ error: 'Flare not found' }, { status: 404 });
    }
    return NextResponse.json({
      credibilityScore: result.credibilityScore,
      upvoteCount: result.upvoteCount,
      already: result.already,
    });
  } catch (err) {
    console.error('[POST /api/tips/.../upvote]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
