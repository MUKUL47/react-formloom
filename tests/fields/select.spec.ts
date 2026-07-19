import { test, expect } from "@playwright/test";

test.describe("Select field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with placeholder", async ({ page }) => {
    const field = page.locator('[data-field-name="department"]');
    await expect(field.getByText("Select...")).toBeVisible();
  });

  test("opens dropdown and shows options", async ({ page }) => {
    const field = page.locator('[data-field-name="department"]');
    await field.getByRole("combobox").click();
    await expect(page.getByRole("option", { name: "Engineering" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Design" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Marketing" })).toBeVisible();
  });

  test("selects an option and displays it", async ({ page }) => {
    const field = page.locator('[data-field-name="department"]');
    const combobox = field.getByRole("combobox");
    await combobox.click();
    await page.getByRole("option", { name: "Design" }).click();
    // The selected value should appear in the combobox trigger
    await expect(combobox).toHaveText("Design");
  });

  test("changes selection", async ({ page }) => {
    const field = page.locator('[data-field-name="department"]');
    const combobox = field.getByRole("combobox");
    await combobox.click();
    await page.getByRole("option", { name: "Design" }).click();
    await expect(combobox).toHaveText("Design");

    await combobox.click();
    await page.getByRole("option", { name: "Marketing" }).click();
    await expect(combobox).toHaveText("Marketing");
  });

  test("shows required error on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Submit" }).click();
    const field = page.locator('[data-field-name="department"]');
    await expect(field.getByText("This field is required")).toBeVisible();
  });
});
