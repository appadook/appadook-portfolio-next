import type { PortfolioSnapshot } from '@/features/public/types';
import { httpJson } from '@/lib/api/http';

export function getPortfolioSnapshotFromApi() {
  return httpJson<PortfolioSnapshot>('/api/portfolio/snapshot');
}
