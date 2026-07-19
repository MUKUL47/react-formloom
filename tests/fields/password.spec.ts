import { test, expect } from "@playwright/test";

test.describe("Password field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders as password type by default", async ({ page }) => {
    const field = page.locator('[data-field-name="password"]');
    const input = field.locator("input");
    await expect(input).toHaveAttribute("type", "password");
  });

  test("toggles visibility on eye icon click", async ({ page }) => {
    const field = page.locator('[data-field-name="password"]');
    const input = field.locator("input");
    const toggleBtn = field.locator("button");

    // Initially password type
    await expect(input).toHaveAttribute("type", "password");

    // Click toggle — should show text
    await toggleBtn.click();
    await expect(input).toHaveAttribute("type", "text");

    // Click again — should hide
    await toggleBtn.click();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("retains value after toggle", async ({ page }) => {
    const field = page.locator('[data-field-name="password"]');
    const input = field.locator("input");
    const toggleBtn = field.locator("button");

    await input.fill("MySecret123");
    await toggleBtn.click();
    await expect(input).toHaveValue("MySecret123");
    await expect(input).toHaveAttribute("type", "text");
  });
});
