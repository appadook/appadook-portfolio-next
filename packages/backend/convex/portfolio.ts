import { v } from 'convex/values';
import { query } from './_generated/server';
import { readPublished } from './lib/content';

export const getSnapshot = query({ args: {}, handler: readPublished });
// Retain public API compatibility while ensuring drafts never escape through old endpoints.
export const getSiteSettings = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).siteSettings,
});
export const getExperiences = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).experiences,
});
export const getProjects = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).projects,
});
export const getProjectsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) =>
    (await readPublished(ctx)).projects.filter(
      (p) => category === 'All' || p.categories.includes(category),
    ),
});
export const getProgrammingLanguages = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).programmingLanguages,
});
export const getTechnologies = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).technologies,
});
export const getTechnologiesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) =>
    (await readPublished(ctx)).technologies.filter(
      (t) => t.category === category,
    ),
});
export const getCloudProvidersWithCertificates = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).cloudProviders,
});
export const getAboutCategories = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).aboutCategories,
});
export const getAboutItems = query({
  args: {},
  handler: async (ctx) => (await readPublished(ctx)).aboutItems,
});
export const getAboutItemsByCategory = query({
  args: { categoryId: v.id('aboutCategories') },
  handler: async (ctx, { categoryId }) =>
    (await readPublished(ctx)).aboutItems.filter(
      (i) => i.categoryId === categoryId,
    ),
});
