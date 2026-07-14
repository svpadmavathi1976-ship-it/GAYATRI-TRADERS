import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as { fullName?: string; username?: string; name?: string; email?: string; profilePicture?: string | null } | undefined;
  const displayName = user?.fullName ?? user?.username ?? user?.name ?? 'Admin';
  const profilePicture = user?.profilePicture ?? null;

  return <AdminLayoutClient displayName={displayName} profilePicture={profilePicture}>{children}</AdminLayoutClient>;
}
