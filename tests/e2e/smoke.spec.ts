import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

const PAGES = ["/", "/problems", "/problems/urban-heat-resilience", "/questions/q-water-1", "/tasks/t-edtech-1b", "/contribute", "/graph", "/signin", "/about", "/docs", "/guidelines", "/privacy", "/terms", "/contact"];

for (const path of PAGES) {
  test(`renders ${path} without errors`, async ({ page }) => {
    const done = trackErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    // No horizontal overflow on any viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    done();
  });
}

test("landing page shows the core message and navigates", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Humanity's hardest problems need more minds working on them.");
  await page.getByRole("link", { name: "Explore Open Problems" }).click();
  await expect(page).toHaveURL(/\/problems/);
  await expect(page.getByRole("heading", { name: "Open problems" })).toBeVisible();
});

test("unknown routes return 404", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Page not found")).toBeVisible();
});
