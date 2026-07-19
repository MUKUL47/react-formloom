import { test, expect } from "@playwright/test";

test.describe("Radio field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders all radio options", async ({ page }) => {
    const field = page.locator('[data-field-name="role"]');
    await expect(field.getByText("Junior")).toBeVisible();
    await expect(field.getByText("Senior")).toBeVisible();
    await expect(field.getByText("Lead")).toBeVisible();
  });

  test("selects a radio option", async ({ page }) => {
    const field = page.locator('[data-field-name="role"]');
    await field.getByText("Lead").click();
    const leadRadio = field.locator('button[role="radio"][data-state="checked"]');
    await expect(leadRadio).toBeVisible();
  });

  test("only one option can be selected at a time", async ({ page }) => {
    const field = page.locator('[data-field-name="role"]');
    await field.getByText("Junior").click();
    // Junior should be checked
    let checked = field.locator('button[role="radio"][data-state="checked"]');
    await expect(checked).toHaveCount(1);

    // Select Senior — Junior should uncheck
    await field.getByText("Senior").click();
    checked = field.locator('button[role="radio"][data-state="checked"]');
    await expect(checked).toHaveCount(1);
  });

  test("shows required error on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Submit" }).click();
    const field = page.locator('[data-field-name="role"]');
    await expect(field.getByText("This field is required")).toBeVisible();
  });
});
