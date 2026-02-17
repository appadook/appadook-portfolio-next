import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const experienceFields = {
  company: v.string(),
  role: v.string(),
  duration: v.string(),
  location: v.string(),
  description: v.string(),
  technologies: v.array(v.string()),
  logo: v.optional(v.string()),
  isCurrent: v.optional(v.boolean()),
  order: v.number(),
};

const projectFields = {
  title: v.string(),
  description: v.string(),
  longDescription: v.optional(v.string()),
  categories: v.array(v.string()),
  techStack: v.array(v.string()),
  status: v.optional(
    v.union(v.literal('new'), v.literal('active'), v.literal('deprecated')),
  ),
  githubUrl: v.optional(v.string()),
  liveUrl: v.optional(v.string()),
  image: v.optional(v.string()),
  features: v.optional(v.array(v.string())),
  challenges: v.optional(v.array(v.string())),
  outcomes: v.optional(v.array(v.string())),
  timeline: v.optional(v.string()),
  teamSize: v.optional(v.string()),
  order: v.number(),
};

const programmingLanguageFields = {
  name: v.string(),
  level: v.union(v.literal('expert'), v.literal('advanced'), v.literal('intermediate')),
  description: v.string(),
  logoUrl: v.optional(v.string()),
  order: v.number(),
};

const technologyFields = {
  name: v.string(),
  category: v.string(),
  description: v.optional(v.string()),
  iconName: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  order: v.number(),
};

const cloudProviderFields = {
  name: v.string(),
  iconName: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  order: v.number(),
};

const certificateFields = {
  name: v.string(),
  providerId: v.id('cloudProviders'),
  image: v.string(),
  year: v.string(),
  description: v.optional(v.string()),
  issuer: v.optional(v.string()),
  credentialId: v.optional(v.string()),
  verificationUrl: v.optional(v.string()),
  skills: v.optional(v.array(v.string())),
  order: v.number(),
};

const aboutCategoryFields = {
  name: v.string(),
  label: v.string(),
  color: v.string(),
  icon: v.string(),
  order: v.number(),
};

const aboutItemFields = {
  categoryId: v.id('aboutCategories'),
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.optional(v.string()),
  date: v.optional(v.string()),
  details: v.optional(v.array(v.string())),
  icon: v.string(),
  image: v.optional(v.string()),
  order: v.number(),
};

export const getAdminBootstrap = query({
  args: {},
  handler: async (ctx) => {
    const [
      siteSettings,
      experiences,
      projects,
      programmingLanguages,
      technologies,
      cloudProviders,
      certificates,
      aboutCategories,
      aboutItems,
    ] = await Promise.all([
      ctx.db
        .query('siteSettings')
        .withIndex('by_key', (q) => q.eq('key', 'global'))
        .unique(),
      ctx.db.query('experiences').collect(),
      ctx.db.query('projects').collect(),
      ctx.db.query('programmingLanguages').collect(),
      ctx.db.query('technologies').collect(),
      ctx.db.query('cloudProviders').collect(),
      ctx.db.query('certificates').collect(),
      ctx.db.query('aboutCategories').collect(),
      ctx.db.query('aboutItems').collect(),
    ]);

    return {
      siteSettings,
      experiences,
      projects,
      programmingLanguages,
      technologies,
      cloudProviders,
      certificates,
      aboutCategories,
      aboutItems,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveStorageUrl = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const upsertSiteSettings = mutation({
  args: {
    siteName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', 'global'))
      .unique();

    const payload = {
      key: 'global',
      siteName: args.siteName,
      tagline: args.tagline,
      logoUrl: args.logoUrl,
      profileImageUrl: args.profileImageUrl,
      resumeUrl: args.resumeUrl,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert('siteSettings', payload);
  },
});

export const createExperience = mutation({
  args: experienceFields,
  handler: async (ctx, args) => await ctx.db.insert('experiences', args),
});

export const updateExperience = mutation({
  args: { id: v.id('experiences'), ...experienceFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteExperience = mutation({
  args: { id: v.id('experiences') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createProject = mutation({
  args: projectFields,
  handler: async (ctx, args) => await ctx.db.insert('projects', args),
});

export const updateProject = mutation({
  args: { id: v.id('projects'), ...projectFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteProject = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorderProjects = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.id('projects'),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const payload = args.items;

    if (payload.length === 0) {
      const existingProjects = await ctx.db.query('projects').take(1);
      if (existingProjects.length > 0) {
        throw new Error('Reorder payload must include all existing projects.');
      }
      return { updatedCount: 0, updatedAt: now };
    }

    const ids = new Set<string>();
    const orders = new Set<number>();

    for (const item of payload) {
      if (ids.has(item.id)) {
        throw new Error(`Duplicate project id in reorder payload: ${item.id}`);
      }
      ids.add(item.id);

      if (!Number.isInteger(item.order) || item.order < 1) {
        throw new Error(`Invalid project order in reorder payload: ${item.order}`);
      }
      if (orders.has(item.order)) {
        throw new Error(`Duplicate project order in reorder payload: ${item.order}`);
      }
      orders.add(item.order);
    }

    const existingProjects = await ctx.db.query('projects').collect();
    if (existingProjects.length !== payload.length) {
      throw new Error('Reorder payload must include every project exactly once.');
    }

    const existingIds = new Set(existingProjects.map((project) => project._id));
    for (const item of payload) {
      if (!existingIds.has(item.id)) {
        throw new Error(`Unknown project id in reorder payload: ${item.id}`);
      }
    }

    const sortedOrders = [...orders].sort((a, b) => a - b);
    for (let index = 0; index < sortedOrders.length; index += 1) {
      const expected = index + 1;
      if (sortedOrders[index] !== expected) {
        throw new Error('Project orders must be contiguous integers starting at 1.');
      }
    }

    for (const item of payload) {
      await ctx.db.patch(item.id, { order: item.order });
    }

    return { updatedCount: payload.length, updatedAt: now };
  },
});

export const reorderExperiences = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.id('experiences'),
        order: v.number(),
      }),
    ),
    currentExperienceId: v.union(v.id('experiences'), v.null()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const payload = args.items;

    if (payload.length === 0) {
      const existingExperiences = await ctx.db.query('experiences').take(1);
      if (existingExperiences.length > 0) {
        throw new Error('Reorder payload must include all existing experiences.');
      }
      return { updatedCount: 0, updatedAt: now, currentExperienceId: null };
    }

    const ids = new Set<string>();
    const orders = new Set<number>();

    for (const item of payload) {
      if (ids.has(item.id)) {
        throw new Error(`Duplicate experience id in reorder payload: ${item.id}`);
      }
      ids.add(item.id);

      if (!Number.isInteger(item.order) || item.order < 1) {
        throw new Error(`Invalid experience order in reorder payload: ${item.order}`);
      }
      if (orders.has(item.order)) {
        throw new Error(`Duplicate experience order in reorder payload: ${item.order}`);
      }
      orders.add(item.order);
    }

    const existingExperiences = await ctx.db.query('experiences').collect();
    if (existingExperiences.length !== payload.length) {
      throw new Error('Reorder payload must include every experience exactly once.');
    }

    const existingIds = new Set(existingExperiences.map((experience) => experience._id));
    for (const item of payload) {
      if (!existingIds.has(item.id)) {
        throw new Error(`Unknown experience id in reorder payload: ${item.id}`);
      }
    }

    if (args.currentExperienceId !== null && !existingIds.has(args.currentExperienceId)) {
      throw new Error(`Unknown experience id for current role: ${args.currentExperienceId}`);
    }

    const sortedOrders = [...orders].sort((a, b) => a - b);
    for (let index = 0; index < sortedOrders.length; index += 1) {
      const expected = index + 1;
      if (sortedOrders[index] !== expected) {
        throw new Error('Experience orders must be contiguous integers starting at 1.');
      }
    }

    for (const item of payload) {
      await ctx.db.patch(item.id, {
        order: item.order,
        isCurrent: args.currentExperienceId === item.id,
      });
    }

    return {
      updatedCount: payload.length,
      updatedAt: now,
      currentExperienceId: args.currentExperienceId,
    };
  },
});

export const createProgrammingLanguage = mutation({
  args: programmingLanguageFields,
  handler: async (ctx, args) => await ctx.db.insert('programmingLanguages', args),
});

export const updateProgrammingLanguage = mutation({
  args: { id: v.id('programmingLanguages'), ...programmingLanguageFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteProgrammingLanguage = mutation({
  args: { id: v.id('programmingLanguages') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createTechnology = mutation({
  args: technologyFields,
  handler: async (ctx, args) => await ctx.db.insert('technologies', args),
});

export const updateTechnology = mutation({
  args: { id: v.id('technologies'), ...technologyFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteTechnology = mutation({
  args: { id: v.id('technologies') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const batchSaveTechnologies = mutation({
  args: {
    creates: v.array(v.object(technologyFields)),
    updates: v.array(v.object({ id: v.id('technologies'), ...technologyFields })),
    deletes: v.array(v.id('technologies')),
  },
  handler: async (ctx, args) => {
    for (const id of args.deletes) {
      await ctx.db.delete(id);
    }
    for (const { id, ...rest } of args.updates) {
      await ctx.db.patch(id, rest);
    }
    for (const item of args.creates) {
      await ctx.db.insert('technologies', item);
    }
    return {
      deletedCount: args.deletes.length,
      updatedCount: args.updates.length,
      createdCount: args.creates.length,
    };
  },
});

export const createCloudProvider = mutation({
  args: cloudProviderFields,
  handler: async (ctx, args) => await ctx.db.insert('cloudProviders', args),
});

export const updateCloudProvider = mutation({
  args: { id: v.id('cloudProviders'), ...cloudProviderFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteCloudProvider = mutation({
  args: { id: v.id('cloudProviders') },
  handler: async (ctx, args) => {
    const relatedCertificates = await ctx.db
      .query('certificates')
      .withIndex('by_provider', (q) => q.eq('providerId', args.id))
      .collect();

    for (const certificate of relatedCertificates) {
      await ctx.db.delete(certificate._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const createCertificate = mutation({
  args: certificateFields,
  handler: async (ctx, args) => await ctx.db.insert('certificates', args),
});

export const updateCertificate = mutation({
  args: { id: v.id('certificates'), ...certificateFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteCertificate = mutation({
  args: { id: v.id('certificates') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createAboutCategory = mutation({
  args: aboutCategoryFields,
  handler: async (ctx, args) => await ctx.db.insert('aboutCategories', args),
});

export const updateAboutCategory = mutation({
  args: { id: v.id('aboutCategories'), ...aboutCategoryFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteAboutCategory = mutation({
  args: { id: v.id('aboutCategories') },
  handler: async (ctx, args) => {
    const relatedItems = await ctx.db
      .query('aboutItems')
      .withIndex('by_category', (q) => q.eq('categoryId', args.id))
      .collect();

    for (const item of relatedItems) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const createAboutItem = mutation({
  args: aboutItemFields,
  handler: async (ctx, args) => await ctx.db.insert('aboutItems', args),
});

export const updateAboutItem = mutation({
  args: { id: v.id('aboutItems'), ...aboutItemFields },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const deleteAboutItem = mutation({
  args: { id: v.id('aboutItems') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
