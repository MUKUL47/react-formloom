import { test, expect } from "@playwright/test";

test.describe("Phone field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with placeholder", async ({ page }) => {
    const input = page.getByPlaceholder("+91 98765 43210");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "tel");
  });

  test("accepts phone number input", async ({ page }) => {
    const input = page.getByPlaceholder("+91 98765 43210");
    await input.fill("+919876543210");
    await expect(input).toHaveValue("+919876543210");
  });

  test("displays help text", async ({ page }) => {
    const field = page.locator('[data-field-name="phone"]');
    await expect(field.getByText("Include country code")).toBeVisible();
  });
});
