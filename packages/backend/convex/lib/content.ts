import type { QueryCtx, MutationCtx } from '../_generated/server';

export async function readContent(ctx: QueryCtx) {
  const [
    siteSettings,
    experiences,
    projects,
    programmingLanguages,
    technologies,
    providers,
    certificates,
    aboutCategories,
    items,
  ] = await Promise.all([
    ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', 'global'))
      .unique(),
    ctx.db.query('experiences').withIndex('by_order').collect(),
    ctx.db.query('projects').withIndex('by_order').collect(),
    ctx.db.query('programmingLanguages').withIndex('by_order').collect(),
    ctx.db.query('technologies').withIndex('by_category_order').collect(),
    ctx.db.query('cloudProviders').withIndex('by_order').collect(),
    ctx.db.query('certificates').withIndex('by_order').collect(),
    ctx.db.query('aboutCategories').withIndex('by_order').collect(),
    ctx.db.query('aboutItems').withIndex('by_order').collect(),
  ]);
  const categories = new Map(aboutCategories.map((c) => [c._id, c]));
  return {
    siteSettings,
    experiences,
    projects,
    programmingLanguages,
    technologies,
    aboutCategories,
    cloudProviders: providers.map((p) => ({
      ...p,
      certificates: certificates.filter((c) => c.providerId === p._id),
    })),
    aboutItems: items.flatMap((item) => {
      const category = categories.get(item.categoryId);
      return category ? [{ ...item, category }] : [];
    }),
  };
}
export type ContentSnapshot = Awaited<ReturnType<typeof readContent>>;

export async function readPublished(ctx: QueryCtx): Promise<ContentSnapshot> {
  const publication = await ctx.db
    .query('publication')
    .withIndex('by_key', (q) => q.eq('key', 'global'))
    .unique();
  // Legacy content remains published until the first edit freezes its snapshot.
  return publication
    ? (JSON.parse(publication.payload) as ContentSnapshot)
    : readContent(ctx);
}

export async function ensurePublication(ctx: MutationCtx) {
  const publication = await ctx.db
    .query('publication')
    .withIndex('by_key', (q) => q.eq('key', 'global'))
    .unique();
  if (publication) return publication;
  const id = await ctx.db.insert('publication', {
    key: 'global',
    payload: JSON.stringify(await readContent(ctx)),
    revision: 0,
    publishedRevision: 0,
    publishedAt: Date.now(),
  });
  return (await ctx.db.get(id))!;
}
