import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("shows the Ape Kade pitch and a call to action", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Ape Kade/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("real online shop");

    const cta = page.getByRole("link", { name: "Create your shop" });
    await expect(cta).toHaveAttribute("href", "/signup");
  });

  test("fits a phone screen without sideways scrolling", async ({ page }) => {
    await page.goto("/");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("has a call to action big enough to tap", async ({ page }) => {
    await page.goto("/");

    // CLAUDE.md design rules: tap targets at least 44 px.
    const box = await page.getByRole("link", { name: "Create your shop" }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test("health check reports the database as reachable", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
