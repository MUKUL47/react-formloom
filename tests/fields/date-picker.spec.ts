import { test, expect } from "@playwright/test";

test.describe("DatePicker field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders date input", async ({ page }) => {
    const field = page.locator('[data-field-name="dateOfBirth"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="date"]');
    await expect(input).toBeVisible();
  });

  test("accepts valid date", async ({ page }) => {
    const field = page.locator('[data-field-name="dateOfBirth"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="date"]');
    await input.fill("1990-06-15");
    await expect(input).toHaveValue("1990-06-15");
  });

  test("validate hook rejects underage DOB", async ({ page }) => {
    const field = page.locator('[data-field-name="dateOfBirth"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="date"]');
    await input.fill("2020-01-01");
    await input.blur();
    await expect(field.getByText("Must be 18+")).toBeVisible();
  });

  test("validate hook accepts adult DOB", async ({ page }) => {
    const field = page.locator('[data-field-name="dateOfBirth"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="date"]');
    await input.fill("1995-05-20");
    await input.blur();
    await expect(field.getByText("Must be 18+")).not.toBeVisible();
  });

  test("displays label", async ({ page }) => {
    const field = page.locator('[data-field-name="dateOfBirth"]');
    await field.scrollIntoViewIfNeeded();
    await expect(field.getByText("Date of Birth")).toBeVisible();
  });
});
