import { test, expect } from "@playwright/test";

test.describe("DateRange field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders start and end date inputs", async ({ page }) => {
    const field = page.locator('[data-field-name="vacationDates"]');
    await field.scrollIntoViewIfNeeded();
    const dateInputs = field.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
  });

  test("displays From and To labels", async ({ page }) => {
    const field = page.locator('[data-field-name="vacationDates"]');
    await field.scrollIntoViewIfNeeded();
    await expect(field.getByText("From")).toBeVisible();
    await expect(field.getByText("To", { exact: true })).toBeVisible();
  });

  test("accepts start and end dates", async ({ page }) => {
    const field = page.locator('[data-field-name="vacationDates"]');
    await field.scrollIntoViewIfNeeded();
    const dateInputs = field.locator('input[type="date"]');
    await dateInputs.nth(0).fill("2026-06-01");
    await dateInputs.nth(1).fill("2026-06-15");
    await expect(dateInputs.nth(0)).toHaveValue("2026-06-01");
    await expect(dateInputs.nth(1)).toHaveValue("2026-06-15");
  });

  test("displays field label", async ({ page }) => {
    const field = page.locator('[data-field-name="vacationDates"]');
    await field.scrollIntoViewIfNeeded();
    await expect(field.getByText("Planned Vacation")).toBeVisible();
  });
});
