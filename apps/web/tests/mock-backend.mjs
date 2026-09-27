import http from "node:http";
import fs from "node:fs";
const seed = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../../packages/backend/convex/seeds/portfolio-base-no-media.json",
      import.meta.url,
    ),
  ),
);
const rows = (key) =>
  (seed[key] ?? []).map((row, i) => ({
    ...row,
    _id: `${key}-${i}`,
    _creationTime: 1,
    version: 0,
  }));
const categories = rows("aboutCategories");
const snapshot = {
  siteSettings: {
    _id: "settings",
    ...(seed.siteSettings ?? {}),
    siteName: "Kurtik Appadoo",
  },
  experiences: rows("experiences"),
  projects: rows("projects"),
  programmingLanguages: rows("programmingLanguages"),
  technologies: rows("technologies"),
  cloudProviders: rows("cloudProviders").map((p) => ({
    ...p,
    certificates: [],
  })),
  aboutCategories: categories,
  aboutItems: rows("aboutItems")
    .map((i) => ({
      ...i,
      category:
        categories.find((c) => c.key === i.categoryKey) ?? categories[0],
    }))
    .filter((i) => i.category),
};
http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/health") {
      res.end("{}");
      return;
    }
    if (req.url?.startsWith("/api/auth/")) {
      if (req.url.endsWith("/convex/token") && req.headers.cookie?.includes("test-owner=1")) {
        const correctOrigin = req.headers["x-better-auth-forwarded-host"] === "127.0.0.1:3333"
          && req.headers["x-better-auth-forwarded-proto"] === "http";
        res.end(JSON.stringify({ token: correctOrigin ? "test-owner" : null }));
        return;
      }
      res.end(
        JSON.stringify(
          req.url.includes("get-session")
            ? null
            : {
                token: req.headers.cookie?.includes("test-backend-error=1")
                  ? "test-backend-error"
                  : null,
              },
        ),
      );
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    const payload = body ? JSON.parse(body) : {};
    if (payload.path === "auth:currentOwner" && req.headers.authorization === "Bearer test-owner") {
      res.end(JSON.stringify({ status: "success", value: { id: "owner", name: "appadook", email: "owner@example.com" } }));
      return;
    }
    if (req.headers.authorization === "Bearer test-backend-error") {
      res.end(
        JSON.stringify({
          status: "error",
          errorMessage: "Simulated backend runtime failure",
        }),
      );
      return;
    }
    if (payload.path === "auth:configuration") {
      res.end(
        JSON.stringify({
          status: "success",
          value: { ready: true, siteUrl: "http://127.0.0.1:3333" },
        }),
      );
      return;
    }
    if (payload.path === "portfolio:getSnapshot")
      res.end(JSON.stringify({ status: "success", value: snapshot }));
    else if (payload.path === "contact:submit")
      res.end(JSON.stringify({ status: "success", value: { accepted: true } }));
    else
      res.end(
        JSON.stringify({
          status: "error",
          errorMessage: "Unauthorized",
          errorData: "Unauthorized",
        }),
      );
  })
  .listen(4322, "127.0.0.1");
