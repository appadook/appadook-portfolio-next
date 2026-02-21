import { AdminProviders } from '@/app/(app)/admin/providers';
import AdminDashboard from '@/features/admin/components/AdminDashboard';
import { requireAdminSessionOrRedirect } from '@/server/auth/session';

export default async function AdminPage() {
  const session = await requireAdminSessionOrRedirect('/admin');

  return (
    <AdminProviders>
      <AdminDashboard
        user={{
          id: session.user.id,
          email: session.user.email,
        }}
      />
    </AdminProviders>
  );
}
