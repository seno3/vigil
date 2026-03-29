import { NextResponse } from 'next/server';
import { getActiveEmergency } from '@/lib/db/emergencies';

export async function GET() {
  const emergency = await getActiveEmergency();
  if (!emergency) return NextResponse.json({ emergency: null });

  return NextResponse.json({
    emergency: {
      id: String(emergency._id),
      type: emergency.type,
      active: emergency.active,
      lat: emergency.lat,
      lng: emergency.lng,
      address: emergency.address,
      createdAt: emergency.createdAt.toISOString(),
    },
  });
}
