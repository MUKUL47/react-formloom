import { test, expect } from "@playwright/test";

test.describe("Number field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders number input", async ({ page }) => {
    const field = page.locator('[data-field-name="age"]');
    const input = field.locator('input[type="number"]');
    await expect(input).toBeVisible();
  });

  test("accepts valid number", async ({ page }) => {
    const field = page.locator('[data-field-name="age"]');
    const input = field.locator('input[type="number"]');
    await input.fill("25");
    await input.blur();
    await expect(field.getByText("Must be 18+")).not.toBeVisible();
    await expect(field.getByText("Max 100")).not.toBeVisible();
  });

  test("validates min value", async ({ page }) => {
    const field = page.locator('[data-field-name="age"]');
    const input = field.locator('input[type="number"]');
    await input.fill("10");
    await input.blur();
    await expect(field.getByText("Must be 18+")).toBeVisible();
  });

  test("validates max value", async ({ page }) => {
    const field = page.locator('[data-field-name="age"]');
    const input = field.locator('input[type="number"]');
    await input.fill("150");
    await input.blur();
    await expect(field.getByText("Max 100")).toBeVisible();
  });

  test("clears error when valid value entered", async ({ page }) => {
    const field = page.locator('[data-field-name="age"]');
    const input = field.locator('input[type="number"]');
    await input.fill("10");
    await input.blur();
    await expect(field.getByText("Must be 18+")).toBeVisible();

    await input.fill("30");
    await input.blur();
    await expect(field.getByText("Must be 18+")).not.toBeVisible();
  });
});
