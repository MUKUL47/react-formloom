import { test, expect } from "@playwright/test";

test.describe("PIN code pattern validation (inside section)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("rejects non-6-digit PIN", async ({ page }) => {
    const field = page.locator('[data-field-name="pincode"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator("input");
    await input.fill("123");
    await input.blur();
    await expect(field.getByText("Must be 6 digits")).toBeVisible();
  });

  test("rejects letters in PIN", async ({ page }) => {
    const field = page.locator('[data-field-name="pincode"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator("input");
    await input.fill("abcdef");
    await input.blur();
    await expect(field.getByText("Must be 6 digits")).toBeVisible();
  });

  test("accepts valid 6-digit PIN", async ({ page }) => {
    const field = page.locator('[data-field-name="pincode"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator("input");
    await input.fill("400001");
    await input.blur();
    await expect(field.getByText("Must be 6 digits")).not.toBeVisible();
  });

  test("clears error when corrected", async ({ page }) => {
    const field = page.locator('[data-field-name="pincode"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator("input");
    await input.fill("12");
    await input.blur();
    await expect(field.getByText("Must be 6 digits")).toBeVisible();

    await input.fill("123456");
    await input.blur();
    await expect(field.getByText("Must be 6 digits")).not.toBeVisible();
  });
});
