import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, findByUsername } from '@/lib/db/users';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password || password.length < 6) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }
  const existing = await findByUsername(username);
  if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser(username, passwordHash);
  const token = signToken(String(user._id));

  const res = NextResponse.json({ _id: String(user._id), username: user.username, credibilityScore: user.credibilityScore });
  res.cookies.set('vigil_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
