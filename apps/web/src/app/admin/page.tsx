import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/features/admin/AdminDashboard';
import { auth } from '@/lib/auth';

export default async function AdminPage() {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') ?? '';
  const host = requestHeaders.get('host') ?? 'localhost';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const request = new Request(`${protocol}://${host}/admin`, {
    headers: cookie ? { cookie } : undefined,
  });

  const session = await auth.server.getSession(request);
  if (!session) {
    redirect('/admin/login');
  }

  return (
    <AdminDashboard
      user={{
        id: session.user.id,
        email: session.user.email ?? 'admin@way.local',
      }}
    />
  );
}
