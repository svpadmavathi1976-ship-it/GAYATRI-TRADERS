import { NextResponse } from 'next/server';
import { createActivityLog } from '@/lib/activity';

export async function POST() {
  const expired = new Date(0).toUTCString();

  await createActivityLog({
    category: 'auth',
    title: 'Admin Logout',
    description: 'The admin logged out successfully.',
  });

  const res = NextResponse.redirect(new URL('/login', 'http://localhost'));

  // Clear common NextAuth session cookie names (secure and non-secure variants)
  res.headers.append('Set-Cookie', `next-auth.session-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax;`);
  res.headers.append('Set-Cookie', `__Secure-next-auth.session-token=; Path=/; Expires=${expired}; HttpOnly; SameSite=Lax; Secure;`);

  return res;
}
