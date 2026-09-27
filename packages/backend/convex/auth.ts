import { type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { APIError } from "better-auth/api";
import type { DataModel } from "./_generated/dataModel";
import { v } from "convex/values";
import { authEnvironment, PRODUCTION_ORIGIN } from "./lib/authOrigins";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

import { authComponent, OWNER_GITHUB_ID } from "./lib/authComponent";
import { requireOwner } from "./lib/owner";
export { authComponent } from "./lib/authComponent";
export const createAuth = (
  ctx: GenericCtx<DataModel>,
  origin = PRODUCTION_ORIGIN,
) => {
  const environment = authEnvironment(origin);
  if (!environment) throw new Error("Unsupported authentication origin");
  return betterAuth({
    baseURL: environment.origin,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    trustedOrigins: [environment.origin],
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    socialProviders: {
      github: {
        clientId: environment.clientId ?? "",
        clientSecret: environment.clientSecret ?? "",
      },
    },
    account: { accountLinking: { enabled: false } },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 20 },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => {
            if (
              account.providerId !== "github" ||
              account.accountId !== OWNER_GITHUB_ID
            ) {
              throw new APIError("FORBIDDEN", {
                message: "This portfolio is restricted to its owner.",
              });
            }
            return { data: account };
          },
        },
      },
    },
    plugins: [convex({ authConfig })],
  });
};

export const currentOwner = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireOwner(ctx);
    return { id: user._id, email: user.email, name: user.name };
  },
});

// Public readiness only; never return credential values or account information.
export const configuration = query({
  args: { origin: v.optional(v.string()) },
  handler: (_ctx, { origin }) => {
    const environment = authEnvironment(origin ?? PRODUCTION_ORIGIN);
    return {
      siteUrl: environment?.origin ?? null,
      ready: Boolean(
        environment?.clientId &&
        environment?.clientSecret &&
        process.env.BETTER_AUTH_SECRET,
      ),
    };
  },
});
