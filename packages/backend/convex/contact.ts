import { paginationOptsValidator } from "convex/server";
import { v, ConvexError } from "convex/values";
import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOwner } from "./lib/owner";

function isContactEmail(email: string) {
  const [local, domain, extra] = email.split("@");
  return (
    extra === undefined &&
    Boolean(local && domain) &&
    local.length <= 64 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) &&
    !local.startsWith(".") &&
    !local.endsWith(".") &&
    !local.includes("..") &&
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
      domain,
    )
  );
}

export const submit = mutation({
  args: {
    secret: v.string(),
    rateKey: v.string(),
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      !process.env.CONTACT_INGEST_SECRET ||
      args.secret !== process.env.CONTACT_INGEST_SECRET
    )
      throw new ConvexError("Unauthorized");
    if (
      args.name.trim().length < 1 ||
      args.name.length > 100 ||
      args.email.length > 254 ||
      !isContactEmail(args.email) ||
      args.message.trim().length < 10 ||
      args.message.length > 5000
    )
      throw new ConvexError(
        "Check your name, email, and message (10–5,000 characters).",
      );
    const now = Date.now();
    // Both per-client and global limits are enforced transactionally.
    for (const [key, max] of [
      [args.rateKey, 3],
      ["global", 30],
    ] as const) {
      const limit = await ctx.db
        .query("contactLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (limit && now - limit.windowStart < 3600000) {
        if (limit.count >= max)
          throw new ConvexError("Too many messages. Please try again later.");
        await ctx.db.patch(limit._id, { count: limit.count + 1 });
      } else if (limit)
        await ctx.db.patch(limit._id, { count: 1, windowStart: now });
      else
        await ctx.db.insert("contactLimits", {
          key,
          count: 1,
          windowStart: now,
        });
    }
    const id = await ctx.db.insert("contactMessages", {
      name: args.name.trim(),
      email: args.email.trim(),
      message: args.message.trim(),
      status: "queued",
      attempts: 0,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.contact.deliver, { id });
    return { accepted: true };
  },
});
export const inbox = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    return ctx.db.query("contactMessages").order("desc").take(100);
  },
});
export const getMessage = internalQuery({
  args: { id: v.id("contactMessages") },
  handler: (ctx, { id }) => ctx.db.get(id),
});
export const updateDelivery = internalMutation({
  args: {
    id: v.id("contactMessages"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    attempts: v.number(),
  },
  handler: (ctx, { id, ...fields }) => ctx.db.patch(id, fields),
});
export const deliver = internalAction({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    const message = await ctx.runQuery(internal.contact.getMessage, { id });
    if (!message || message.status === "sent") return;
    const attempts = message.attempts + 1;
    try {
      if (
        !process.env.RESEND_API_KEY ||
        !process.env.CONTACT_FROM_EMAIL ||
        !process.env.CONTACT_TO_EMAIL
      )
        throw new Error("Email delivery is not configured");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `contact-${id}`,
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL,
          to: process.env.CONTACT_TO_EMAIL,
          reply_to: message.email,
          subject: "Portfolio contact message",
          text: `${message.name}\n${message.email}\n\n${message.message}`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Email provider rejected delivery");
      await ctx.runMutation(internal.contact.updateDelivery, {
        id,
        attempts,
        status: "sent",
      });
    } catch {
      console.error(
        "Contact delivery failed; message retained in admin inbox",
        { id, attempts },
      );
      await ctx.runMutation(internal.contact.updateDelivery, {
        id,
        attempts,
        status: "failed",
      });
      if (attempts < 4)
        await ctx.scheduler.runAfter(
          60000 * 2 ** attempts,
          internal.contact.deliver,
          { id },
        );
    }
  },
});
export const retryDelivery = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await requireOwner(ctx);
    const message = await ctx.db.get(id);
    if (!message || message.status !== "failed")
      throw new ConvexError("Only failed deliveries can be retried.");
    await ctx.db.patch(id, { status: "queued", attempts: 0 });
    await ctx.scheduler.runAfter(0, internal.contact.deliver, { id });
  },
});

export const messages = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
    ),
  },
  handler: async (ctx, { paginationOpts, status }) => {
    await requireOwner(ctx);
    const messages = status
      ? ctx.db
          .query("contactMessages")
          .withIndex("by_status", (q) => q.eq("status", status))
      : ctx.db.query("contactMessages");
    return messages.order("desc").paginate(paginationOpts);
  },
});
