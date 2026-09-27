/// <reference types="vite/client" />
import { convexToJson, jsonToConvex, type Value } from "convex/values";
import { convexTest } from "convex-test";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import authTest from "@convex-dev/better-auth/test";
import schema from "../convex/schema";
import { api, components } from "../convex/_generated/api";
import { validateContent, validateAsset } from "../convex/lib/validation";
const modules = import.meta.glob("../convex/**/*.ts");
function setup() {
  const t = convexTest(schema, modules);
  authTest.register(t);
  return t;
}
async function signedIn(
  t: ReturnType<typeof setup>,
  accountId = "168853630",
  expired = false,
) {
  const now = Date.now();
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "user",
      data: {
        name: "Test owner",
        email: "owner@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "account",
      data: {
        userId: user._id,
        providerId: "github",
        accountId,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "session",
      data: {
        userId: user._id,
        token: "test-only",
        expiresAt: now + (expired ? -1000 : 3600000),
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  return {
    owner: t.withIdentity({ subject: user._id, sessionId: session._id }),
    session,
  };
}
const project = {
  title: "Live project",
  description: "Description",
  categories: ["Web"],
  techStack: ["TypeScript"],
  order: 1,
};
beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("REVALIDATE_SECRET", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
});
describe("backend authorization", () => {
  it("rejects anonymous writes, reads, uploads, and publishing", async () => {
    const t = setup();
    await expect(t.mutation(api.admin.createProject, project)).rejects.toThrow(
      "Unauthorized",
    );
    await expect(t.query(api.admin.getAdminBootstrap, {})).rejects.toThrow(
      "Unauthorized",
    );
    await expect(t.mutation(api.admin.generateUploadUrl, {})).rejects.toThrow(
      "Unauthorized",
    );
    await expect(
      t.mutation(api.publishing.publish, { expectedRevision: 0 }),
    ).rejects.toThrow("Unauthorized");
    await expect(t.query(api.contact.inbox, {})).rejects.toThrow(
      "Unauthorized",
    );
  });
  it("denies authenticated non-owners", async () => {
    const t = setup();
    const { owner } = await signedIn(t, "other-account");
    await expect(
      owner.mutation(api.admin.createProject, project),
    ).rejects.toThrow("Forbidden");
  });
  it("denies expired sessions even with a valid identity", async () => {
    const t = setup();
    const { owner } = await signedIn(t, "168853630", true);
    await expect(owner.query(api.admin.getAdminBootstrap, {})).rejects.toThrow(
      "Unauthorized",
    );
  });
  it("denies a revoked session immediately", async () => {
    const t = setup();
    const { owner, session } = await signedIn(t);
    await owner.query(api.admin.getAdminBootstrap, {});
    await t.mutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "session",
        where: [{ field: "_id", value: session._id }],
      },
    });
    await expect(owner.query(api.admin.getAdminBootstrap, {})).rejects.toThrow(
      "Unauthorized",
    );
  });
});
describe("publishing and conflicts", () => {
  it("preserves legacy published content, isolates edits, and rejects stale writes", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const id = await t.run((ctx) => ctx.db.insert("projects", project));
    await owner.mutation(api.admin.updateProject, {
      ...project,
      id,
      title: "Private draft",
      expectedVersion: 0,
    });
    expect((await t.query(api.portfolio.getProjects, {}))[0].title).toBe(
      "Live project",
    );
    expect(
      (await owner.query(api.publishing.preview, {})).projects[0].title,
    ).toBe("Private draft");
    await expect(
      owner.mutation(api.admin.updateProject, {
        ...project,
        id,
        title: "Stale edit",
        expectedVersion: 0,
      }),
    ).rejects.toThrow("changed in another tab");
    await expect(
      owner.mutation(api.publishing.publish, { expectedRevision: 0 }),
    ).rejects.toThrow("Content changed");
    await owner.mutation(api.publishing.publish, { expectedRevision: 1 });
    expect(
      (await t.query(api.portfolio.getSnapshot, {})).projects[0].title,
    ).toBe("Private draft");
  });
  it("keeps new content private until published", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    await owner.mutation(api.admin.createProject, project);
    expect(await t.query(api.portfolio.getProjects, {})).toEqual([]);
  });
  it("rejects invalid URLs, oversized content, and invalid order values", () => {
    expect(() => validateContent({ liveUrl: "javascript:alert(1)" })).toThrow();
    expect(() => validateContent({ description: "x".repeat(20001) })).toThrow();
    expect(() => validateContent({ order: -1 })).toThrow();
    expect(() => validateAsset("image/svg+xml", 100)).toThrow();
    expect(() => validateAsset("image/png", 6000000)).toThrow();
  });
  it("rejects invalid references and incomplete reorders", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    await owner.mutation(api.admin.createProject, project);
    await expect(
      owner.mutation(api.admin.reorderProjects, {
        expectedRevision: 1,
        items: [],
      }),
    ).rejects.toThrow("all existing projects");
    expect((await owner.query(api.publishing.status, {})).revision).toBe(1);
  });
});
describe("contact intake", () => {
  it("requires the server secret and enforces transactional limits", async () => {
    vi.stubEnv("CONTACT_INGEST_SECRET", "test-secret");
    const t = setup();
    const input = {
      secret: "test-secret",
      rateKey: "test-client",
      name: "Visitor",
      email: "visitor@example.com",
      message: "Hello, this is a test message.",
    };
    await expect(
      t.mutation(api.contact.submit, { ...input, secret: "wrong" }),
    ).rejects.toThrow("Unauthorized");
    await expect(
      t.mutation(api.contact.submit, { ...input, email: "invalid" }),
    ).rejects.toThrow("Check your");
    for (let i = 0; i < 3; i++)
      expect(await t.mutation(api.contact.submit, input)).toEqual({
        accepted: true,
      });
    await expect(t.mutation(api.contact.submit, input)).rejects.toThrow(
      "Too many messages",
    );
    expect(
      await t.run((ctx) => ctx.db.query("contactMessages").collect()),
    ).toHaveLength(3);
  });
});

describe("storage validation and cleanup", () => {
  it("rejects and deletes a file with a spoofed MIME type", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["not a png"], { type: "image/png" })),
    );
    await expect(
      owner.action(api.admin.resolveStorageUrl, { storageId }),
    ).rejects.toThrow("does not match");
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
    expect(await t.run((ctx) => ctx.db.query("assets").collect())).toEqual([]);
  });
  it("registers valid media and preserves draft and published references during cleanup", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const storageId = await t.run((ctx) =>
      ctx.storage.store(
        new Blob(["%PDF-1.7 test"], { type: "application/pdf" }),
      ),
    );
    const url = await owner.action(api.admin.resolveStorageUrl, { storageId });
    expect(url).toBeTruthy();
    await owner.mutation(api.admin.upsertSiteSettings, {
      expectedRevision: 0,
      resumeUrl: url!,
    });
    await owner.mutation(api.publishing.publish, { expectedRevision: 1 });
    await owner.mutation(api.admin.upsertSiteSettings, {
      expectedRevision: 1,
      resumeUrl: undefined,
    });
    await t.run(async (ctx) => {
      for (const asset of await ctx.db.query("assets").collect())
        await ctx.db.patch(asset._id, { createdAt: Date.now() - 172800000 });
    });
    expect(await owner.mutation(api.publishing.cleanUnusedAssets, {})).toBe(0);
    await owner.mutation(api.publishing.publish, { expectedRevision: 2 });
    expect(await owner.mutation(api.publishing.cleanUnusedAssets, {})).toBe(1);
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
  });
});

describe("server-rendered owner session", () => {
  it("resolves the owner through the exact query used by the Next.js route guard", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    expect(await owner.query(api.auth.currentOwner, {})).toMatchObject({
      email: "owner@example.com",
      name: "Test owner",
    });
  });
  it("rejects anonymous, non-owner and expired sessions through the route guard query", async () => {
    const t = setup();
    await expect(t.query(api.auth.currentOwner, {})).rejects.toThrow(
      "Unauthorized",
    );
    const { owner: other } = await signedIn(t, "other-account");
    await expect(other.query(api.auth.currentOwner, {})).rejects.toThrow(
      "Forbidden",
    );
    const { owner: expired } = await signedIn(setup(), "168853630", true);
    await expect(expired.query(api.auth.currentOwner, {})).rejects.toThrow(
      "Unauthorized",
    );
  });
});

describe("editorial workspace", () => {
  it("reviews real field changes, additions and removals, excluding version-only changes", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const id = await owner.mutation(api.admin.createProject, project);
    let review = await owner.query(api.publishing.review, {});
    expect(review.changes).toMatchObject([
      { id, section: "projects", kind: "added" },
    ]);
    await owner.mutation(api.publishing.publish, {
      expectedRevision: review.revision,
    });
    await owner.mutation(api.admin.updateProject, {
      ...project,
      id,
      expectedVersion: 0,
      title: "Revised",
    });
    review = await owner.query(api.publishing.review, {});
    expect(review.changes).toEqual([
      {
        id,
        section: "projects",
        kind: "updated",
        title: "Revised",
        fields: ["title"],
      },
    ]);
    await owner.mutation(api.admin.updateProject, {
      ...project,
      id,
      expectedVersion: 1,
    });
    expect((await owner.query(api.publishing.review, {})).changes).toEqual([]);
    await owner.mutation(api.admin.deleteProject, { id, expectedVersion: 2 });
    expect(
      (await owner.query(api.publishing.review, {})).changes,
    ).toMatchObject([{ id, kind: "deleted" }]);
  });
  it("protects workspace queries and paginates delivery filters", async () => {
    const t = setup();
    const paginationOpts = { numItems: 2, cursor: null };
    await expect(t.query(api.publishing.review, {})).rejects.toThrow(
      "Unauthorized",
    );
    await expect(
      t.query(api.publishing.assets, { paginationOpts }),
    ).rejects.toThrow("Unauthorized");
    await expect(
      t.query(api.contact.messages, { paginationOpts }),
    ).rejects.toThrow("Unauthorized");
    const { owner } = await signedIn(t);
    await t.run(async (ctx) => {
      for (const status of ["sent", "failed", "failed", "failed"] as const)
        await ctx.db.insert("contactMessages", {
          name: "Visitor",
          email: "visitor@example.com",
          message: "Hello from the contact form.",
          createdAt: Date.now(),
          status,
          attempts: 1,
        });
    });
    const first = await owner.query(api.contact.messages, {
      paginationOpts,
      status: "failed",
    });
    expect(first.page).toHaveLength(2);
    expect(first.page.every((message) => message.status === "failed")).toBe(
      true,
    );
    const second = await owner.query(api.contact.messages, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
      status: "failed",
    });
    expect(second.page).toHaveLength(1);
    expect(second.isDone).toBe(true);
  });
  it("prevents removal of newly uploaded and published assets, then allows unused files", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const storageId = await t.run((ctx) =>
      ctx.storage.store(
        new Blob(["%PDF-1.7 test"], { type: "application/pdf" }),
      ),
    );
    const url = await owner.action(api.admin.resolveStorageUrl, {
      storageId,
      fileName: "resume.pdf",
    });
    const paginationOpts = { numItems: 24, cursor: null };
    const [asset] = (
      await owner.query(api.publishing.assets, { paginationOpts })
    ).page;
    expect(asset.fileName).toBe("resume.pdf");
    expect(asset.removable).toBe(false);
    await expect(
      owner.mutation(api.publishing.removeAsset, { id: asset._id }),
    ).rejects.toThrow("24 hours");
    await owner.mutation(api.admin.upsertSiteSettings, {
      expectedRevision: 0,
      resumeUrl: url!,
    });
    await owner.mutation(api.publishing.publish, { expectedRevision: 1 });
    await t.run((ctx) =>
      ctx.db.patch(asset._id, { createdAt: Date.now() - 172800000 }),
    );
    await owner.mutation(api.admin.upsertSiteSettings, {
      expectedRevision: 1,
      siteName: "Portfolio",
    });
    await expect(
      owner.mutation(api.publishing.removeAsset, { id: asset._id }),
    ).rejects.toThrow("in use");
    expect(
      (await owner.query(api.publishing.assets, { paginationOpts })).page[0]
        .usage,
    ).toMatchObject([{ state: "published", section: "site-settings" }]);
    await owner.mutation(api.publishing.publish, { expectedRevision: 2 });
    await owner.mutation(api.publishing.removeAsset, { id: asset._id });
    expect(
      (await owner.query(api.publishing.assets, { paginationOpts })).page,
    ).toEqual([]);
  });
});

// Match the browser transport: undefined object properties do not reach handlers.
function wire<T extends Value>(args: T): T {
  return jsonToConvex(convexToJson(args)) as T;
}
describe("review regressions", () => {
  it("explicitly clears optional fields, preserving omitted values and published content", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const id = await owner.mutation(api.admin.createProject, {
      ...project,
      liveUrl: "https://example.com/old",
      image: "https://example.com/image.png",
      githubUrl: "https://github.com/appadook",
      status: "active",
    });
    await owner.mutation(api.publishing.publish, { expectedRevision: 1 });
    await owner.mutation(
      api.admin.updateProject,
      wire({
        ...project,
        id,
        expectedVersion: 0,
        liveUrl: undefined,
        image: undefined,
        clearFields: ["liveUrl", "image"],
      }),
    );
    const draft = (await owner.query(api.publishing.preview, {})).projects[0];
    expect(draft.liveUrl).toBeUndefined();
    expect(draft.image).toBeUndefined();
    expect(draft.githubUrl).toBe("https://github.com/appadook");
    expect(draft.status).toBe("active");
    expect(draft.version).toBe(1);
    expect((await t.query(api.portfolio.getProjects, {}))[0].liveUrl).toBe(
      "https://example.com/old",
    );
    await owner.mutation(api.publishing.publish, { expectedRevision: 2 });
    expect(
      (await t.query(api.portfolio.getProjects, {}))[0].liveUrl,
    ).toBeUndefined();
  });
  it("rejects required, system, unknown and conflicting clears atomically", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const id = await owner.mutation(api.admin.createProject, project);
    for (const field of ["title", "version", "_id", "unknown", "__proto__"]) {
      await expect(
        owner.mutation(api.admin.updateProject, {
          ...project,
          id,
          expectedVersion: 0,
          clearFields: [field],
        }),
      ).rejects.toThrow("Cannot clear field");
    }
    await expect(
      owner.mutation(api.admin.updateProject, {
        ...project,
        id,
        expectedVersion: 0,
        liveUrl: "https://example.com",
        clearFields: ["liveUrl"],
      }),
    ).rejects.toThrow("Cannot both set and clear");
    expect((await owner.query(api.publishing.status, {})).revision).toBe(1);
    expect(
      (await owner.query(api.publishing.preview, {})).projects[0].version,
    ).toBeUndefined();
  });
  it("clears bulk technology media and text without removing required fields", async () => {
    const t = setup();
    const { owner } = await signedIn(t);
    const technology = { name: "React", category: "Frontend", order: 1 };
    const id = await owner.mutation(api.admin.createTechnology, {
      ...technology,
      description: "Old",
      iconName: "SiReact",
      iconUrl: "https://example.com/react.png",
    });
    await owner.mutation(
      api.admin.batchSaveTechnologies,
      wire({
        expectedRevision: 1,
        creates: [],
        deletes: [],
        updates: [
          {
            ...technology,
            id,
            description: undefined,
            iconName: undefined,
            iconUrl: undefined,
            clearFields: ["description", "iconName", "iconUrl"],
          },
        ],
      }),
    );
    const result = (await owner.query(api.admin.getAdminBootstrap, {}))
      .technologies[0];
    expect(result).toMatchObject({ ...technology, version: 1 });
    expect(result.description).toBeUndefined();
    expect(result.iconName).toBeUndefined();
    expect(result.iconUrl).toBeUndefined();
  });
  it("rejects mailto injection and malformed addresses before storing messages", async () => {
    vi.stubEnv("CONTACT_INGEST_SECRET", "test-secret");
    const t = setup();
    const input = {
      secret: "test-secret",
      rateKey: "review",
      name: "Visitor",
      message: "A message for the portfolio owner.",
    };
    for (const email of [
      "visitor@example.com?bcc=copy%40attacker.example",
      "visitor@example.com#fragment",
      "visitor@example.com@",
      "visitor@example.com\r\nBcc:evil@example.com",
      "visitor@-example.com",
      "visitor..name@example.com",
    ])
      await expect(
        t.mutation(api.contact.submit, { ...input, email }),
      ).rejects.toThrow("Check your");
    expect(
      await t.run((ctx) => ctx.db.query("contactMessages").collect()),
    ).toEqual([]);
    await expect(
      t.mutation(api.contact.submit, {
        ...input,
        email: "visitor+portfolio@example.co.uk",
      }),
    ).resolves.toEqual({ accepted: true });
  });
});

describe("shared deployment authentication", () => {
  const local = "http://localhost:3000";
  const production = "https://appadook-portfolio-next.vercel.app";
  const secret = "test-only-shared-auth-secret-at-least-32-characters";
  beforeEach(() => {
    vi.stubEnv("CONVEX_SITE_URL", "https://shared-test.convex.site");
    vi.stubEnv("BETTER_AUTH_SECRET", secret);
    vi.stubEnv("GITHUB_CLIENT_ID", "local-client");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "local-secret");
    vi.stubEnv("GITHUB_PRODUCTION_CLIENT_ID", "production-client");
    vi.stubEnv("GITHUB_PRODUCTION_CLIENT_SECRET", "production-secret");
  });
  function forwarded(origin: string) {
    const url = new URL(origin);
    return {
      "x-better-auth-forwarded-host": url.host,
      "x-better-auth-forwarded-proto": url.protocol.slice(0, -1),
    };
  }
  it.each([local, production])(
    "starts OAuth with the correct app and callback for %s",
    async (origin) => {
      const t = setup();
      const response = await t.fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          ...forwarded(origin),
          origin,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "github",
          callbackURL: `${origin}/admin`,
          disableRedirect: true,
        }),
      });
      expect(response.status).toBe(200);
      const url = new URL((await response.json()).url);
      expect(url.origin).toBe("https://github.com");
      expect(url.searchParams.get("client_id")).toBe(
        origin === local ? "local-client" : "production-client",
      );
      expect(url.searchParams.get("redirect_uri")).toBe(
        `${origin}/api/auth/callback/github`,
      );
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      expect(response.headers.get("set-cookie")?.includes("Secure;")).toBe(
        origin === production,
      );
    },
  );
  it("rejects unapproved hosts and cross-origin callbacks", async () => {
    const t = setup();
    for (const [origin, callback] of [
      ["https://attacker.example", "https://attacker.example/admin"],
      [local, `${production}/admin`],
    ]) {
      const response = await t.fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          ...forwarded(origin),
          origin,
          "content-type": "application/json",
        },
        body: JSON.stringify({ provider: "github", callbackURL: callback }),
      });
      expect(response.status).toBe(403);
    }
  });
  it("checks readiness per origin without exposing credentials", async () => {
    const t = setup();
    expect(await t.query(api.auth.configuration, { origin: local })).toEqual({
      siteUrl: local,
      ready: true,
    });
    vi.stubEnv("GITHUB_PRODUCTION_CLIENT_SECRET", "");
    expect(
      await t.query(api.auth.configuration, { origin: production }),
    ).toEqual({ siteUrl: production, ready: false });
    expect(
      await t.query(api.auth.configuration, {
        origin: "https://attacker.example",
      }),
    ).toEqual({ siteUrl: null, ready: false });
  });
  it.each([local, production])(
    "reads the shared owner's session with origin-specific cookies for %s",
    async (origin) => {
      const t = setup();
      await signedIn(t);
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = new Uint8Array(
        await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode("test-only"),
        ),
      );
      const value = encodeURIComponent(
        `test-only.${btoa(String.fromCharCode(...signature))}`,
      );
      const prefix = origin === production ? "__Secure-" : "";
      // Convex's edge replaces standard forwarding headers; the adapter restores
      // the web origin from its dedicated headers for server-rendered requests.
      const url = new URL(origin);
      const response = await t.fetch("/api/auth/get-session", {
        headers: {
          "x-forwarded-host": new URL(process.env.CONVEX_SITE_URL!).host,
          "x-forwarded-proto": "https",
          "x-better-auth-forwarded-host": url.host,
          "x-better-auth-forwarded-proto": url.protocol.slice(0, -1),
          cookie: `${prefix}better-auth.session_token=${value}`,
        },
      });
      expect(response.status).toBe(200);
      expect((await response.json())?.user?.email).toBe("owner@example.com");
    },
  );
});
