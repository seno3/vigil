import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findByUsername } from '@/lib/db/users';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const user = await findByUsername(username);
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = signToken(String(user._id));
  const res = NextResponse.json({ _id: String(user._id), username: user.username, credibilityScore: user.credibilityScore, tipsSubmitted: user.tipsSubmitted });
  res.cookies.set('vigil_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
