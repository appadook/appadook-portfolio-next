import { createRoot } from 'react-dom/client';
import AdminDashboard from '@/features/admin/components/AdminDashboard';
import { Providers } from '@/app/providers';
import { initialData } from './convex';
import '@/app/globals.css';
createRoot(document.getElementById('root')!).render(
  <Providers>
    <AdminDashboard
      user={{ id: 'owner', email: 'owner@example.com' }}
      initialData={initialData}
    />
  </Providers>,
);
