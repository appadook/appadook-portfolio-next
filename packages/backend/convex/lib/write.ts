import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireOwner } from "./owner";
import { ensurePublication } from "./content";
import { validateContent } from "./validation";

export async function prepareWrite(
  ctx: MutationCtx,
  args: Record<string, unknown>,
) {
  await requireOwner(ctx);
  validateContent(args);
  for (const field of ["providerId", "categoryId"]) {
    if (args[field] && !(await ctx.db.get(args[field] as Id<"cloudProviders">)))
      throw new ConvexError("The referenced record no longer exists.");
  }
  const publication = await ensurePublication(ctx);
  if (
    typeof args.expectedRevision === "number" &&
    args.expectedRevision !== publication.revision
  ) {
    throw new ConvexError(
      "Content changed in another tab. Reload before saving.",
    );
  }
  if (args.id) {
    const doc = await ctx.db.get(args.id as Id<"projects">);
    if (!doc) throw new ConvexError("This record no longer exists.");
    if (
      args.expectedVersion !== doc.version &&
      !(args.expectedVersion === 0 && doc.version === undefined)
    ) {
      throw new ConvexError(
        "This record changed in another tab. Your draft has been kept. Copy any edits you want to preserve, then use Discard draft and reload saved version.",
      );
    }
    await ctx.db.patch(doc._id, { version: (doc.version ?? 0) + 1 });
  }
  await ctx.db.patch(publication._id, { revision: publication.revision + 1 });
}

// Omitted arguments preserve existing values. Clearing must be explicit because
// undefined object properties are dropped by Convex's wire format.
export function contentPatch<T extends Record<string, unknown>>(
  values: T,
  fields: Record<string, { isOptional: string }>,
  clearFields: string[] = [],
): T {
  const patch: Record<string, unknown> = { ...values };
  for (const field of clearFields) {
    if (
      !Object.prototype.hasOwnProperty.call(fields, field) ||
      fields[field].isOptional !== "optional"
    )
      throw new ConvexError(`Cannot clear field: ${field}`);
    if (values[field] !== undefined)
      throw new ConvexError(`Cannot both set and clear field: ${field}`);
    patch[field] = undefined;
  }
  return patch as T;
}
