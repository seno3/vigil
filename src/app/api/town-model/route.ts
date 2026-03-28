import { NextRequest, NextResponse } from 'next/server';
import { buildTownModel } from '@/lib/townModel';
import { DEMO_TOWN_MODEL } from '@/lib/fallback';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address: string = body.address ?? 'Moore, Oklahoma';

    const townModel = await buildTownModel(address);
    return NextResponse.json({ townModel });
  } catch (err) {
    console.error('Town model error:', err);
    // Always return fallback so demo never breaks
    return NextResponse.json({ townModel: DEMO_TOWN_MODEL, fallback: true });
  }
}
