import { test, expect } from "@playwright/test";

test.describe("Slider field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with label and default value", async ({ page }) => {
    const field = page.locator('[data-field-name="experience"]');
    await field.scrollIntoViewIfNeeded();
    await expect(field).toBeVisible();
    // Should display min, current (default 3), and max values
    await expect(field.getByText("0", { exact: true })).toBeVisible();
    await expect(field.getByText("3", { exact: true })).toBeVisible();
    await expect(field.getByText("20", { exact: true })).toBeVisible();
  });

  test("renders slider thumb", async ({ page }) => {
    const field = page.locator('[data-field-name="experience"]');
    await field.scrollIntoViewIfNeeded();
    const slider = field.locator('[role="slider"]');
    await expect(slider).toBeVisible();
  });

  test("slider can be interacted with via keyboard", async ({ page }) => {
    const field = page.locator('[data-field-name="experience"]');
    await field.scrollIntoViewIfNeeded();
    const slider = field.locator('[role="slider"]');
    await slider.focus();
    // Press ArrowRight to increment
    await slider.press("ArrowRight");
    await slider.press("ArrowRight");
    // Default was 3, now should be 5
    await expect(field.getByText("5")).toBeVisible();
  });
});
