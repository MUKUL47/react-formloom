import { test, expect } from "@playwright/test";

test.describe("Switch field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with label", async ({ page }) => {
    const field = page.locator('[data-field-name="remoteWork"]');
    await expect(field.getByText("Prefer remote work")).toBeVisible();
  });

  test("starts unchecked", async ({ page }) => {
    const field = page.locator('[data-field-name="remoteWork"]');
    const switchEl = field.locator('button[role="switch"]');
    await expect(switchEl).toHaveAttribute("data-state", "unchecked");
  });

  test("toggles on", async ({ page }) => {
    const field = page.locator('[data-field-name="remoteWork"]');
    const switchEl = field.locator('button[role="switch"]');
    await switchEl.click();
    await expect(switchEl).toHaveAttribute("data-state", "checked");
  });

  test("toggles off after being on", async ({ page }) => {
    const field = page.locator('[data-field-name="remoteWork"]');
    const switchEl = field.locator('button[role="switch"]');
    await switchEl.click();
    await expect(switchEl).toHaveAttribute("data-state", "checked");
    await switchEl.click();
    await expect(switchEl).toHaveAttribute("data-state", "unchecked");
  });
});
