import { test, expect } from "@playwright/test";

test.describe("TimePicker field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders time input", async ({ page }) => {
    const field = page.locator('[data-field-name="preferredTime"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="time"]');
    await expect(input).toBeVisible();
  });

  test("accepts time value", async ({ page }) => {
    const field = page.locator('[data-field-name="preferredTime"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="time"]');
    await input.fill("14:30");
    await expect(input).toHaveValue("14:30");
  });

  test("displays label", async ({ page }) => {
    const field = page.locator('[data-field-name="preferredTime"]');
    await field.scrollIntoViewIfNeeded();
    await expect(field.getByText("Preferred Contact Time")).toBeVisible();
  });
});
