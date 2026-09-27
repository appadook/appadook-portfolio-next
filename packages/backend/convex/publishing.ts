import { paginationOptsValidator } from "convex/server";
import { compareContent, assetUsage } from "./lib/review";
import { v, ConvexError } from "convex/values";
import { mutation, query, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner } from "./lib/owner";
import { ensurePublication, readContent, readPublished } from "./lib/content";

export const status = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const p = await ctx.db
      .query("publication")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    return {
      revision: p?.revision ?? 0,
      publishedRevision: p?.publishedRevision ?? 0,
      publishedAt: p?.publishedAt ?? null,
    };
  },
});
export const preview = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    return readContent(ctx);
  },
});
export const publish = mutation({
  args: { expectedRevision: v.number() },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const p = await ensurePublication(ctx);
    if (args.expectedRevision !== p.revision)
      throw new ConvexError(
        "Content changed. Review the latest draft before publishing.",
      );
    await ctx.db.patch(p._id, {
      payload: JSON.stringify(await readContent(ctx)),
      publishedRevision: p.revision,
      publishedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.publishing.invalidate, {
      attempt: 0,
    });
  },
});
export const invalidate = internalAction({
  args: { attempt: v.number() },
  handler: async (ctx, { attempt }) => {
    const site = process.env.SITE_URL;
    const secret = process.env.REVALIDATE_SECRET;
    if (!site || !secret) {
      console.error(
        "Publication cache invalidation is not configured. Time-based refresh remains active.",
      );
      return;
    }
    try {
      const response = await fetch(`${site}/api/revalidate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new Error(`Invalidation failed: ${response.status}`);
    } catch {
      console.error("Publication cache invalidation failed", { attempt });
      if (attempt < 4)
        await ctx.scheduler.runAfter(
          1000 * 2 ** attempt,
          internal.publishing.invalidate,
          { attempt: attempt + 1 },
        );
    }
  },
});
export const cleanUnusedAssets = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const references = JSON.stringify([
      await readContent(ctx),
      await readPublished(ctx),
    ]);
    let removed = 0;
    for (const asset of await ctx.db.query("assets").collect()) {
      // Grace period protects uploads not yet attached to a saved draft.
      if (
        asset.createdAt < Date.now() - 86400000 &&
        !references.includes(asset.url)
      ) {
        await ctx.storage.delete(asset.storageId);
        await ctx.db.delete(asset._id);
        removed++;
      }
    }
    return removed;
  },
});

export const review = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const [draft, published, publication] = await Promise.all([
      readContent(ctx),
      readPublished(ctx),
      ctx.db
        .query("publication")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .unique(),
    ]);
    return {
      revision: publication?.revision ?? 0,
      changes: compareContent(draft, published),
    };
  },
});
export const assets = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireOwner(ctx);
    const [result, draft, published] = await Promise.all([
      ctx.db.query("assets").order("desc").paginate(paginationOpts),
      readContent(ctx),
      readPublished(ctx),
    ]);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (asset) => {
          const metadata = await ctx.db.system.get(asset.storageId);
          const usage = assetUsage(asset.url, draft, published);
          return {
            ...asset,
            contentType: metadata?.contentType ?? "",
            size: metadata?.size ?? 0,
            usage,
            removable:
              usage.length === 0 && asset.createdAt < Date.now() - 86400000,
          };
        }),
      ),
    };
  },
});
export const removeAsset = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => {
    await requireOwner(ctx);
    const asset = await ctx.db.get(id);
    if (!asset) throw new ConvexError("This file has already been removed.");
    const [draft, published] = await Promise.all([
      readContent(ctx),
      readPublished(ctx),
    ]);
    if (
      assetUsage(asset.url, draft, published).length ||
      asset.createdAt > Date.now() - 86400000
    )
      throw new ConvexError(
        "This file is in use or was uploaded within the last 24 hours.",
      );
    await ctx.storage.delete(asset.storageId);
    await ctx.db.delete(id);
  },
});
