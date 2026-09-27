import { test, expect } from "@playwright/test";
const editorURL =
  "http://127.0.0.1:3334/admin?section=projects&item=project-1&mode=edit";
test("admin deep links open a single editor and save a draft", async ({
  page,
}, testInfo) => {
  await page.goto(editorURL);
  const title = page.getByRole("textbox", { name: "Title", exact: false });
  await expect(title).toHaveCount(1);
  await title.fill("Updated project");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Updated project", exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Review changes", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("admin.png"),
    fullPage: true,
  });
});
test("admin recovers edits and preserves input after a conflict", async ({
  page,
}) => {
  await page.goto(editorURL);
  const title = page.getByRole("textbox", { name: "Title", exact: false });
  await title.fill("Recovery draft");
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(title).toHaveValue("Recovery draft");
  await page.evaluate(() =>
    sessionStorage.setItem("simulate-conflict", "true"),
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("changed in another tab");
  await expect(title).toHaveValue("Recovery draft");
  await page
    .getByRole("button", { name: "Discard draft and reload saved version" })
    .click();
  await expect(title).toHaveValue("Example project");
});

test("review saved changes before publishing and retain editor search", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3334/admin?section=projects");
  await page
    .getByRole("textbox", { name: "Search this section" })
    .fill("Example");
  await page
    .getByRole("button", { name: "Edit Example project", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Title", exact: false })
    .fill("Example revised");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Saved draft · Not yet published")).toBeVisible();
  // A second save must use the new baseline/version without reopening the editor.
  await page
    .getByRole("textbox", { name: "Title", exact: false })
    .fill("Example revised again");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Search this section" }),
  ).toHaveValue("Example");
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Example revised again");
  await page
    .getByRole("button", { name: "Publish changes", exact: true })
    .click();
  await expect(page.getByText("Published successfully")).toBeVisible();
});
test("tag controls, repeatable fields, and filtered empty states", async ({
  page,
}) => {
  await page.goto(editorURL);
  await page
    .getByRole("textbox", { name: "Tech Stack", exact: false })
    .fill("React");
  await page
    .getByRole("textbox", { name: "Tech Stack", exact: false })
    .press("Enter");
  await expect(
    page.getByRole("button", { name: "Remove React", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove React", exact: true }).click();
  const features = page
    .locator(".admin-field-wide")
    .filter({ has: page.getByText("Features", { exact: true }) });
  await features.getByRole("button", { name: "Features", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Features 1" })
    .fill("Accessible editing");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search this section" })
    .fill("does not exist");
  await expect(
    page.getByText("No matching content", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Example project", exact: true }),
  ).toBeVisible();
});
test("workspace navigation exposes media and inbox on all screens", async ({
  page,
}, testInfo) => {
  await page.goto("http://127.0.0.1:3334/admin?section=projects");
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Media", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Media library", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Your media library starts here")).toBeVisible();
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inbox", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No messages", { exact: true })).toBeVisible();
});

test("individual technology edits retain the record version", async ({
  page,
}) => {
  await page.goto(
    "http://127.0.0.1:3334/admin?section=technologies&item=technology-1&mode=edit",
  );
  await page
    .getByRole("textbox", { name: "Name", exact: false })
    .fill("React updated");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Saved draft · Not yet published")).toBeVisible();
});
test("editor layout and keyboard exit", async ({ page }, testInfo) => {
  await page.goto(editorURL);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("editor.png"),
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

for (const modifier of ["Control", "Meta"]) {
  test(`${modifier}+Enter saves the pending tag with the rest of the form`, async ({
    page,
  }) => {
    await page.goto(editorURL);
    const tagInput = page.getByRole("textbox", {
      name: "Tech Stack",
      exact: false,
    });
    await tagInput.fill("PendingTag");
    await tagInput.press(`${modifier}+Enter`);
    await expect(
      page.getByText("Saved draft · Not yet published"),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("portfolio-editor:projects:project-1"),
      ),
    ).toBeNull();
    await page
      .getByRole("button", { name: "Close editor", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Edit Example project", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Remove PendingTag", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Recovered draft", { exact: false }),
    ).toHaveCount(0);
  });
}
test("publication status reflects saves after a successful publish", async ({
  page,
}) => {
  await page.goto(editorURL);
  const title = page.getByRole("textbox", { name: "Title", exact: false });
  const save = page.getByRole("button", { name: "Save draft", exact: true });
  const close = page.getByRole("button", { name: "Close editor", exact: true });
  await title.fill("First revision");
  await save.click();
  await close.click();
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish changes", exact: true })
    .click();
  await expect(page.locator(".admin-state")).toHaveText(
    "Published successfully",
  );
  await page
    .getByRole("button", { name: "Edit First revision", exact: true })
    .click();
  await title.fill("Second revision");
  await save.click();
  await close.click();
  await expect(page.locator(".admin-state")).toHaveText("Unpublished changes");
});
test("reply links encode legacy email values without mailto headers", async ({
  page,
}) => {
  const email = "visitor@example.com?bcc=copy%40attacker.example";
  await page.addInitScript(
    (value) => sessionStorage.setItem("test-legacy-email", value),
    email,
  );
  await page.goto("http://127.0.0.1:3334/admin?section=inbox");
  await page.getByRole("button", { name: /Legacy visitor/ }).click();
  const href = await page
    .getByRole("link", { name: "Reply by email" })
    .getAttribute("href");
  const url = new URL(href!);
  expect(url.search).toBe("");
  expect(url.hash).toBe("");
  expect(decodeURIComponent(url.pathname)).toBe(email);
});
test("cleared optional links stay cleared when the editor reopens", async ({
  page,
}) => {
  await page.goto(editorURL);
  const link = page.getByRole("textbox", { name: "Live URL", exact: true });
  const save = page.getByRole("button", { name: "Save draft", exact: true });
  await link.fill("https://example.com/project");
  await save.click();
  await expect(page.getByText("Saved draft · Not yet published")).toBeVisible();
  await link.fill("");
  await save.click();
  await expect(page.getByText("Saved draft · Not yet published")).toBeVisible();
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit Example project", exact: true })
    .click();
  await expect(link).toHaveValue("");
});
