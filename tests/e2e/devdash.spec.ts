import { expect, test } from "@playwright/test";

const authenticatedRoutes = [
  "/dashboard",
  "/timeline",
  "/repositories",
  "/pull-requests",
  "/pipelines",
  "/analytics",
  "/developer-health",
  "/ai-brief",
  "/focus",
  "/tasks",
  "/calendar",
  "/integrations",
  "/notifications",
  "/settings",
  "/privacy",
];

test("landing page and authentication boundary", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Make the work",
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/signin/);
});

test("authenticated navigation, search, and task CRUD", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const session = await request.post("/api/test/session");
  expect(session.ok()).toBeTruthy();
  const state = await request.storageState();
  await page.context().addCookies(state.cookies);

  for (const route of authenticatedRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
  }

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+k" : "Control+k",
  );
  await expect(
    page.getByRole("dialog", { name: "Search workspace" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/tasks");
  await page.getByLabel("Title").fill("E2E task");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByRole("heading", { name: "E2E task" })).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  const editForm = page.locator("form").filter({
    has: page.getByRole("button", { name: "Save changes" }),
  });
  await editForm.getByLabel("Title").fill("Edited E2E task");
  await editForm.getByLabel("Status").selectOption("IN_PROGRESS");
  await editForm.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Edited E2E task" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Complete" }).click();
  await expect(
    page.getByRole("heading", { name: "Edited E2E task" }),
  ).toHaveCount(0);
  await page.getByLabel("Filter by status").selectOption("COMPLETED");
  await expect(
    page.getByRole("heading", { name: "Edited E2E task" }),
  ).toBeVisible();
  await expect(page.getByText(/completed/)).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Edited E2E task" }),
  ).toHaveCount(0);
});

test("mobile navigation and keyboard focus are usable", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only interaction");
  await request.post("/api/test/session");
  const state = await request.storageState();
  await page.context().addCookies(state.cookies);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Repositories" }).first(),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
