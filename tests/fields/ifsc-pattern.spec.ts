import { test, expect } from "@playwright/test";

test.describe("IFSC code pattern validation (inside tabs)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
    // Navigate to Bank Details tab
    await page.getByRole("button", { name: "Bank Details" }).click();
  });

  test("rejects invalid IFSC format", async ({ page }) => {
    const field = page.locator('[data-field-name="ifscCode"]');
    const input = field.locator("input");
    await input.fill("invalid");
    await input.blur();
    await expect(field.getByText("Invalid IFSC")).toBeVisible();
  });

  test("accepts valid IFSC code", async ({ page }) => {
    const field = page.locator('[data-field-name="ifscCode"]');
    const input = field.locator("input");
    await input.fill("SBIN0001234");
    await input.blur();
    await expect(field.getByText("Invalid IFSC")).not.toBeVisible();
  });

  test("clears error when corrected", async ({ page }) => {
    const field = page.locator('[data-field-name="ifscCode"]');
    const input = field.locator("input");
    await input.fill("bad");
    await input.blur();
    await expect(field.getByText("Invalid IFSC")).toBeVisible();

    await input.fill("HDFC0001234");
    await input.blur();
    await expect(field.getByText("Invalid IFSC")).not.toBeVisible();
  });
});
