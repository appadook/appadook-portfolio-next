import 'server-only';

import { cache } from 'react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@portfolio/backend/convex/_generated/api';
import type { PortfolioSnapshot } from '@/features/public/types';
import { getConvexPublicUrl } from '@/server/env';
import {
  mapAboutCategory,
  mapAboutItem,
  mapCloudProvider,
  mapExperience,
  mapProgrammingLanguage,
  mapProject,
  mapSiteSettings,
  mapTechnology,
  isPresent,
} from '@/features/public/lib/mappers';

export const EMPTY_SNAPSHOT: PortfolioSnapshot = {
  siteSettings: {
    _id: 'site-settings',
  },
  experiences: [],
  projects: [],
  programmingLanguages: [],
  technologies: [],
  cloudProviders: [],
  aboutCategories: [],
  aboutItems: [],
};

const getConvexClient = cache(() => {
  const convexUrl = getConvexPublicUrl();
  if (!convexUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Convex client not created: NEXT_PUBLIC_CONVEX_URL is missing or invalid (must be an origin URL).',
      );
    }
    return null;
  }
  return new ConvexHttpClient(convexUrl);
});

export const getPortfolioSnapshot = cache(async (): Promise<PortfolioSnapshot> => {
  const client = getConvexClient();
  if (!client) {
    return EMPTY_SNAPSHOT;
  }

  try {
    const [
      rawSiteSettings,
      rawExperiences,
      rawProjects,
      rawProgrammingLanguages,
      rawTechnologies,
      rawCloudProviders,
      rawAboutCategories,
      rawAboutItems,
    ] = await Promise.all([
      client.query(api.portfolio.getSiteSettings, {}),
      client.query(api.portfolio.getExperiences, {}),
      client.query(api.portfolio.getProjects, {}),
      client.query(api.portfolio.getProgrammingLanguages, {}),
      client.query(api.portfolio.getTechnologies, {}),
      client.query(api.portfolio.getCloudProvidersWithCertificates, {}),
      client.query(api.portfolio.getAboutCategories, {}),
      client.query(api.portfolio.getAboutItems, {}),
    ]);

    return {
      siteSettings: rawSiteSettings ? mapSiteSettings(rawSiteSettings) : EMPTY_SNAPSHOT.siteSettings,
      experiences: rawExperiences.map(mapExperience),
      projects: rawProjects.map(mapProject),
      programmingLanguages: rawProgrammingLanguages.map(mapProgrammingLanguage),
      technologies: rawTechnologies.map(mapTechnology),
      cloudProviders: rawCloudProviders.map(mapCloudProvider),
      aboutCategories: rawAboutCategories.map(mapAboutCategory),
      aboutItems: rawAboutItems.filter(isPresent).map(mapAboutItem),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch portfolio snapshot:', error);
    }
    return EMPTY_SNAPSHOT;
  }
});
