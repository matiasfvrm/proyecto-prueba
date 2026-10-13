import { expect, test } from "@playwright/test";
import { signInAs, signOut, trackErrors } from "./helpers";

test("claim → submit → independent review, persisted across reloads", async ({ page }) => {
  const done = trackErrors(page);
  await page.goto("/tasks/t-heat-1a");
  await expect(page.getByRole("link", { name: "Sign in to claim" })).toBeVisible();

  await signInAs(page, "Lucas Ferreira");
  await page.goto("/tasks/t-heat-1a");
  await page.getByRole("button", { name: "Claim this task" }).click();
  await expect(page.getByText("Task claimed")).toBeVisible();

  // Validation feedback
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Title must be at least 5 characters.")).toBeVisible();

  await page.getByLabel("Title").fill("Detrending module v0.1");
  await page.getByLabel("Summary").fill("Implements three detrending methods with unit tests and a comparison notebook on labeled synthetic data.");
  await page.getByLabel("Link 1").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/Enter a full http\(s\) link/)).toBeVisible();
  await page.getByLabel("Link 1").fill("https://example.org/detrend");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Contribution submitted for review.")).toBeVisible();
  await expect(page.getByText("In review").first()).toBeVisible();

  // The author cannot review their own work.
  await expect(page.getByRole("button", { name: "Submit review" })).toHaveCount(0);

  await signOut(page);
  await signInAs(page, "Mei Tanaka");
  await page.goto("/tasks/t-heat-1a");
  const criteria = page.getByRole("checkbox");
  // Accepting without confirming criteria is refused.
  await page.getByText("Accept deliverable").click();
  await page.getByRole("textbox", { name: "Comment for the contributor" }).fill("Clear implementation and tests.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText(/confirm that every acceptance criterion is met/)).toBeVisible();
  for (const box of await criteria.all()) await box.check();
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("Review recorded.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Completed").first()).toBeVisible();
  await expect(page.getByText("Deliverable accepted").first()).toBeVisible();
  // Task completion does not validate the research question.
  await page.goto("/questions/q-heat-1");
  await expect(page.getByText("Under investigation").first()).toBeVisible();
  done();
});

test("propose a problem, then a moderator publishes it as Proposed", async ({ page }) => {
  const done = trackErrors(page);
  await signInAs(page, "Jonas Becker");
  await page.goto("/submit");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Title must be at least 10 characters.")).toBeVisible();

  await page.getByLabel("Problem title").fill("Low-cost water quality sensors for schools");
  await expect(page.getByText("Improving low-cost water quality monitoring")).toBeVisible(); // duplicate hint

  await page.getByLabel("Problem title").fill("Keeping school ventilation adequate on a budget");
  await page.getByLabel("Category").selectOption("infrastructure");
  await page.getByLabel("Description").fill("Many schools lack affordable ways to check whether classrooms are ventilated well enough, and improvements are hard to prioritize without measurements.");
  await page.getByLabel("Why it matters").fill("Ventilation affects comfort and indoor air quality for students and staff.");
  await page.getByLabel("Available evidence").fill("Public guidance exists on indoor air quality; local measurements are rare.");
  await page.getByLabel("Relevant sources 1").fill("https://www.epa.gov/");
  await page.getByLabel("Potential research questions 1").fill("Which low-cost CO2 sensors give reliable readings in classrooms?");

  await page.getByRole("button", { name: "Check for gaps" }).click();
  await expect(page.getByText(/checklist found|No obvious gaps|AI-generated/)).toBeVisible();

  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("heading", { name: "Submitted for review" })).toBeVisible();

  await page.goto("/problems?q=ventilation");
  await expect(page.getByText("No problems match these filters")).toBeVisible();

  await signOut(page);
  await signInAs(page, "Sofía Ramírez");
  await page.goto("/review?tab=moderation");
  await page.getByRole("button", { name: "Accept as “Proposed”" }).click();
  await expect(page.getByText(/now published with status/)).toBeVisible();

  await page.goto("/problems?q=ventilation");
  const card = page.locator("main ul li article");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Proposed");
  await card.getByRole("link").click();
  await expect(page.getByText("Community submission")).toBeVisible();
  await page.getByRole("tab", { name: /Evidence/ }).click();
  await expect(page.getByText("Validation criteria have not been defined yet")).toBeVisible();
  done();
});

test("following a problem shows it on the dashboard", async ({ page }) => {
  await signInAs(page, "Priya Nair");
  await page.goto("/problems/urban-heat-resilience");
  await page.getByRole("button", { name: "Follow problem" }).click();
  await expect(page.getByRole("button", { name: "Following" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Improving heat resilience in cities" }).first()).toBeVisible();
  await expect(page.getByText(/Suggested because it/).first()).toBeVisible();
});

test("create a local profile", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Create profile and sign in" }).click();
  await expect(page.getByText("Name must be at least 2 characters.")).toBeVisible();
  await page.getByLabel("Display name").fill("Test Person");
  await page.getByLabel("Handle").fill("test_person");
  await page.getByRole("button", { name: "Python", exact: true }).click();
  await page.getByRole("button", { name: "Create profile and sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome back, Test" })).toBeVisible();
});
