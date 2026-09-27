import { AdminProviders } from './providers';
import AdminDashboard from '@/features/admin/components/AdminDashboard';
import {
  getAuthServer,
  requireAdminSessionOrRedirect,
} from '@/server/auth/session';
import { api } from '@portfolio/backend/convex/_generated/api';
export default async function AdminPage() {
  const { user } = await requireAdminSessionOrRedirect();
  const [initialToken, initialData] = await Promise.all([
    getAuthServer().getToken(),
    getAuthServer().fetchAuthQuery(api.admin.getAdminBootstrap, {}),
  ]);
  return (
    <AdminProviders initialToken={initialToken}>
      <AdminDashboard user={user} initialData={initialData} />
    </AdminProviders>
  );
}
