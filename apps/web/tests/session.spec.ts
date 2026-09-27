import { test, expect } from "@playwright/test";

test("SSR session forwarding preserves the deployment origin and overwrites spoofed headers", async ({ request }) => {
  const cases: Record<string, string>[] = [{}, {
    "x-better-auth-forwarded-host": "attacker.example",
    "x-better-auth-forwarded-proto": "https",
  }];
  for (const forwarded of cases) {
    const response = await request.get("/api/auth/me", {
      headers: { cookie: "test-owner=1", ...forwarded },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).user.name).toBe("appadook");
  }
});

test("session API distinguishes authorization denial from backend failure", async ({
  request,
}) => {
  const anonymous = await request.get("/api/auth/me");
  expect(anonymous.status()).toBe(401);
  const failure = await request.get("/api/auth/me", {
    headers: { cookie: "test-backend-error=1" },
  });
  expect(failure.status()).toBe(500);
  expect(await failure.json()).toEqual({ error: "Internal Server Error" });
});

test("sign-in reports rate limiting instead of blaming development credentials", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.route("**/api/auth/sign-in/social", (route) =>
    route.fulfill({
      status: 429,
      json: { code: "TOO_MANY_REQUESTS", message: "Too many requests" },
    }),
  );
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Too many sign-in attempts",
  );
  await expect(
    page.getByRole("button", { name: "Continue with GitHub" }),
  ).toBeEnabled();
});
test("sign-in reports a rejected origin", async ({ page }) => {
  await page.goto("/admin/login");
  await page.route("**/api/auth/sign-in/social", (route) =>
    route.fulfill({
      status: 403,
      json: { code: "INVALID_ORIGIN", message: "Invalid origin" },
    }),
  );
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "approved local or production URL",
  );
});
