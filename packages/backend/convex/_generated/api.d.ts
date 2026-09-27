/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as http from "../http.js";
import type * as lib_authComponent from "../lib/authComponent.js";
import type * as lib_authOrigins from "../lib/authOrigins.js";
import type * as lib_content from "../lib/content.js";
import type * as lib_owner from "../lib/owner.js";
import type * as lib_review from "../lib/review.js";
import type * as lib_validation from "../lib/validation.js";
import type * as lib_write from "../lib/write.js";
import type * as portfolio from "../portfolio.js";
import type * as publishing from "../publishing.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  contact: typeof contact;
  http: typeof http;
  "lib/authComponent": typeof lib_authComponent;
  "lib/authOrigins": typeof lib_authOrigins;
  "lib/content": typeof lib_content;
  "lib/owner": typeof lib_owner;
  "lib/review": typeof lib_review;
  "lib/validation": typeof lib_validation;
  "lib/write": typeof lib_write;
  portfolio: typeof portfolio;
  publishing: typeof publishing;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
