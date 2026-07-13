import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const displayName = (session.user as { fullName?: string; username?: string; name?: string; email?: string } | undefined)?.fullName
    ?? (session.user as { fullName?: string; username?: string; name?: string; email?: string } | undefined)?.username
    ?? (session.user as { fullName?: string; username?: string; name?: string; email?: string } | undefined)?.name
    ?? 'Admin';

  return <AdminLayoutClient displayName={displayName}>{children}</AdminLayoutClient>;
}
