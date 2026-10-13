import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

test("graph supports search, inspection, filtering and navigation", async ({ page }) => {
  const done = trackErrors(page);
  await page.goto("/graph");
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
  const total = await page.locator(".react-flow__node").count();
  expect(total).toBeGreaterThan(50);

  await page.getByRole("button", { name: /^Task$/ }).click();
  await expect.poll(() => page.locator(".react-flow__node").count()).toBeLessThan(total);

  await page.getByLabel("Search nodes").fill("turbidity sensor");
  await page.getByRole("option").first().click();
  await expect(page.getByText(/Connected \(\d+\)/)).toBeVisible();
  await page.getByRole("link", { name: "Open record" }).click();
  await expect(page).toHaveURL(/\/questions\/q-water-1/);
  done();
});

test("graph deep link focuses a node", async ({ page }) => {
  await page.goto("/graph?focus=p-food");
  await expect(page.getByRole("complementary", { name: /inspector/ })).toContainText("Reducing food waste in urban supply chains");
});
