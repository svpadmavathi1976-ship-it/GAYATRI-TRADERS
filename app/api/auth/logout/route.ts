import { NextResponse } from 'next/server';

export async function POST() {
  const expired = new Date(0).toUTCString();

  const res = NextResponse.redirect(new URL('/login', 'http://localhost'));

  // Clear common NextAuth session cookie names (secure and non-secure variants)
  res.headers.append('Set-Cookie', `next-auth.session-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax;`);
  res.headers.append('Set-Cookie', `__Secure-next-auth.session-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax; Secure;`);

  return res;
}
