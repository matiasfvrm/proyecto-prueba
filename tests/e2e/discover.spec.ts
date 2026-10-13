import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

test("search and filters change results and the URL", async ({ page }) => {
  const done = trackErrors(page);
  await page.goto("/problems");
  const cards = page.locator("main ul li article");
  await expect(cards).toHaveCount(7);

  await page.getByLabel("Search problems").fill("turbidity");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("water quality");
  await expect(page).toHaveURL(/q=turbidity/);

  await page.getByLabel("Search problems").fill("");
  await page.getByRole("button", { name: "Energy", exact: true }).click();
  await expect(cards).toHaveCount(2);

  await page.getByRole("button", { name: "Advanced", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("off-grid health clinics");

  await page.getByRole("button", { name: "Validated", exact: true }).click();
  await expect(page.getByText("No problems match these filters")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(cards).toHaveCount(7);
  done();
});

test("filters survive a reload via the URL", async ({ page }) => {
  await page.goto("/problems?categories=climate");
  await expect(page.locator("main ul li article")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Climate and Environment" })).toHaveAttribute("aria-pressed", "true");
});

test("problem detail tabs and navigation to tasks and questions", async ({ page }) => {
  const done = trackErrors(page);
  await page.goto("/problems/low-cost-water-quality-monitoring");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Improving low-cost water quality monitoring");
  await page.getByRole("tab", { name: /Evidence/ }).click();
  await expect(page.getByText("Validation criteria")).toBeVisible();
  await expect(page.getByText("Documented in sources").first()).toBeVisible();
  await expect(page).toHaveURL(/tab=evidence/);

  await page.getByRole("tab", { name: /Tasks/ }).click();
  await page.getByRole("button", { name: /^Open \(/ }).click();
  await page.getByRole("link", { name: "Build a CSV-to-schema converter" }).click();
  await expect(page).toHaveURL(/\/tasks\/t-water-3b/);
  await page.getByRole("link", { name: /What open data format/ }).first().click();
  await expect(page).toHaveURL(/\/questions\/q-water-3/);
  await expect(page.getByRole("heading", { name: "Related tasks" })).toBeVisible();
  done();
});
