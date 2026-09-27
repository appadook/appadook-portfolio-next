import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@portfolio/backend/convex/_generated/api';
import type { ContentSnapshot } from '@portfolio/backend/convex/lib/content';
import type { PortfolioSnapshot } from '@/features/public/types';
import {
  mapAboutCategory,
  mapAboutItem,
  mapCloudProvider,
  mapExperience,
  mapProgrammingLanguage,
  mapProject,
  mapSiteSettings,
  mapTechnology,
} from '@/features/public/lib/mappers';

export function mapSnapshot(raw: ContentSnapshot): PortfolioSnapshot {
  return {
    siteSettings: raw.siteSettings ? mapSiteSettings(raw.siteSettings) : {},
    experiences: raw.experiences.map(mapExperience),
    projects: raw.projects.map(mapProject),
    programmingLanguages: raw.programmingLanguages.map(mapProgrammingLanguage),
    technologies: raw.technologies.map(mapTechnology),
    cloudProviders: raw.cloudProviders.map(mapCloudProvider),
    aboutCategories: raw.aboutCategories.map(mapAboutCategory),
    aboutItems: raw.aboutItems.map(mapAboutItem),
  };
}
const cachedSnapshot = unstable_cache(
  async (url: string) => {
    // Failed requests throw: they must never replace the last successful cache entry.
    const client = new ConvexHttpClient(url);
    try {
      return mapSnapshot(await client.query(api.portfolio.getSnapshot, {}));
    } catch (error) {
      console.error('Portfolio query failed', {
        cause: error instanceof Error ? error.name : 'Unknown',
      });
      throw new Error('Portfolio content is temporarily unavailable.');
    }
  },
  ['published-portfolio-v2'],
  { revalidate: 60, tags: ['portfolio'] },
);
export const getPortfolioSnapshot = cache(async () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('Portfolio content is not configured.');
  return cachedSnapshot(url);
});
