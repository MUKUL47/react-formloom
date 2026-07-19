import { test, expect } from "@playwright/test";

test.describe("Heading field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders as correct heading level (h2)", async ({ page }) => {
    const heading = page.locator("h2").filter({ hasText: "Employee Onboarding" });
    await expect(heading).toBeVisible();
  });

  test("heading tag is h2, not h1 or h3", async ({ page }) => {
    // Should exist as h2
    await expect(page.locator("h2").filter({ hasText: "Employee Onboarding" })).toHaveCount(1);
    // Should NOT exist as h1 or h3
    await expect(page.locator("h1").filter({ hasText: "Employee Onboarding" })).toHaveCount(0);
    await expect(page.locator("h3").filter({ hasText: "Employee Onboarding" })).toHaveCount(0);
  });
});
