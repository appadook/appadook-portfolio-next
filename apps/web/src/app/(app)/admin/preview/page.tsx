import Link from 'next/link';
import PortfolioPage from '@/features/public/PortfolioPage';
import {
  getAuthServer,
  requireAdminSessionOrRedirect,
} from '@/server/auth/session';
import { mapSnapshot } from '@/server/backend/portfolio';
import { api } from '@portfolio/backend/convex/_generated/api';
export default async function PreviewPage() {
  await requireAdminSessionOrRedirect();
  const raw = await getAuthServer().fetchAuthQuery(api.publishing.preview, {});
  return (
    <>
      <div className="sticky top-0 z-[60] bg-primary px-6 py-3 text-center text-sm text-primary-foreground">
        Private preview · saved drafts{' '}
        <Link className="ml-4 underline" href="/admin">
          Back to editing
        </Link>
      </div>
      <PortfolioPage snapshot={mapSnapshot(raw)} />
    </>
  );
}
