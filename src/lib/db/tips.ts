import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectDB } from './mongodb';
import type { TipCategory, TipUrgency, TipStatus } from '@/types';

export interface ITip extends Document {
  userId: mongoose.Types.ObjectId;
  location: { type: string; coordinates: [number, number] };
  buildingId?: string;
  category: TipCategory;
  description: string;
  urgency: TipUrgency;
  credibilityScore: number;
  status: TipStatus;
  corroboratingTips: mongoose.Types.ObjectId[];
  contradictingTips: mongoose.Types.ObjectId[];
  agentAnalysis?: { classification: string; threatLevel: string; reasoning: string };
  createdAt: Date;
  expiresAt: Date;
}

const tipSchema = new Schema<ITip>({
  userId:       { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  buildingId:   { type: String },
  category:     { type: String, required: true },
  description:  { type: String, required: true },
  urgency:      { type: String, default: 'medium' },
  credibilityScore: { type: Number, default: 50 },
  status:       { type: String, default: 'pending' },
  corroboratingTips: [{ type: Schema.Types.ObjectId, ref: 'Tip' }],
  contradictingTips: [{ type: Schema.Types.ObjectId, ref: 'Tip' }],
  agentAnalysis: {
    classification: String,
    threatLevel:    String,
    reasoning:      String,
  },
  createdAt:    { type: Date, default: Date.now },
  expiresAt:    { type: Date, required: true },
});
tipSchema.index({ location: '2dsphere' });

function getTipModel(): Model<ITip> {
  return mongoose.models.Tip as Model<ITip> || mongoose.model<ITip>('Tip', tipSchema);
}

export async function createTip(data: {
  userId: string;
  location: [number, number];
  buildingId?: string;
  category: TipCategory;
  description: string;
  urgency: TipUrgency;
  credibilityScore: number;
  expiresAt: Date;
}): Promise<ITip> {
  await connectDB();
  return getTipModel().create({
    ...data,
    location: { type: 'Point', coordinates: data.location },
    userId: new mongoose.Types.ObjectId(data.userId),
  });
}

export async function getTipsInArea(
  lng: number, lat: number, radiusMeters: number, since?: Date
): Promise<ITip[]> {
  await connectDB();
  const query: Record<string, unknown> = {
    location: { $nearSphere: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radiusMeters } },
    status: { $nin: ['resolved', 'flagged'] },
  };
  if (since) query.createdAt = { $gte: since };
  return getTipModel().find(query).sort({ createdAt: -1 }).limit(100);
}

export async function getTipsForBuilding(buildingId: string, since?: Date): Promise<ITip[]> {
  await connectDB();
  const query: Record<string, unknown> = { buildingId, status: { $nin: ['resolved', 'flagged'] } };
  if (since) query.createdAt = { $gte: since };
  return getTipModel().find(query).sort({ createdAt: -1 });
}

export async function updateTipAnalysis(
  tipId: string,
  analysis: { classification: string; threatLevel: string; reasoning: string },
  status: TipStatus,
): Promise<void> {
  await connectDB();
  await getTipModel().findByIdAndUpdate(tipId, { agentAnalysis: analysis, status });
}

export async function getActiveThreatBuildings(): Promise<
  Array<{ buildingId: string; tipCount: number; threatLevel: string }>
> {
  await connectDB();
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const results = await getTipModel().aggregate([
    { $match: { category: 'active_threat', createdAt: { $gte: since }, buildingId: { $exists: true }, status: { $nin: ['resolved', 'flagged'] } } },
    { $group: { _id: '$buildingId', tipCount: { $sum: 1 }, maxUrgency: { $max: '$urgency' } } },
    { $match: { tipCount: { $gte: 2 } } },
  ]);
  return results.map((r) => ({
    buildingId: r._id as string,
    tipCount: r.tipCount as number,
    threatLevel: r.tipCount >= 5 ? 'critical' : r.tipCount >= 3 ? 'warning' : 'advisory',
  }));
}
