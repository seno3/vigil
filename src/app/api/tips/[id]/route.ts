import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongodb';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const Tip = mongoose.models.Tip;
  if (!Tip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const tip = await Tip.findById(id);
  if (!tip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(tip);
}
