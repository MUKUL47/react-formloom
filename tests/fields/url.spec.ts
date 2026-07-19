import { test, expect } from "@playwright/test";

test.describe("URL field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with placeholder", async ({ page }) => {
    const field = page.locator('[data-field-name="website"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="url"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", "https://example.com");
  });

  test("accepts valid URL", async ({ page }) => {
    const field = page.locator('[data-field-name="website"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="url"]');
    await input.fill("https://example.com");
    await input.blur();
    // No error should appear
    await expect(field.getByText("Invalid URL")).not.toBeVisible();
  });

  test("rejects invalid URL", async ({ page }) => {
    const field = page.locator('[data-field-name="website"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="url"]');
    await input.fill("not-a-url");
    await input.blur();
    await expect(field.getByText("Invalid URL")).toBeVisible();
  });

  test("clears error when valid URL entered", async ({ page }) => {
    const field = page.locator('[data-field-name="website"]');
    await field.scrollIntoViewIfNeeded();
    const input = field.locator('input[type="url"]');
    await input.fill("bad");
    await input.blur();
    await expect(field.getByText("Invalid URL")).toBeVisible();

    await input.fill("https://valid.com");
    await input.blur();
    await expect(field.getByText("Invalid URL")).not.toBeVisible();
  });
});
