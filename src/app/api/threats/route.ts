import { NextResponse } from 'next/server';
import { getActiveThreatBuildings } from '@/lib/db/tips';

export async function GET() {
  const threats = await getActiveThreatBuildings();
  return NextResponse.json(threats);
}
