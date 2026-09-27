import { connection } from 'next/server';
import PortfolioPage from '@/features/public/PortfolioPage';
import { getPortfolioSnapshot } from '@/server/backend/portfolio';
export default async function HomePage() {
  // Render on the server using shared cached content, without requiring backend access at build time.
  await connection();
  return <PortfolioPage snapshot={await getPortfolioSnapshot()} />;
}
