import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SettingsPageClient from '@/components/admin/settings/SettingsPageClient';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as { fullName?: string; email?: string; username?: string; name?: string };

  return (
    <SettingsPageClient
      admin={{
        fullName: user.fullName || user.name || 'Admin',
        email: user.email || '',
        username: user.username || '',
        lastLogin: null,
      }}
    />
  );
}
