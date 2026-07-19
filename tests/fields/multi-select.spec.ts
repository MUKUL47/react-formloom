import { test, expect } from "@playwright/test";

test.describe("MultiSelect field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
    // Must select Engineering to make techStack visible
    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Engineering" }).click();
    // Wait for side effect to show techStack
    await expect(page.getByText("Tech Stack")).toBeVisible();
  });

  test("renders with placeholder when nothing selected", async ({ page }) => {
    const field = page.locator('[data-field-name="techStack"]');
    await expect(field.getByText("Select...")).toBeVisible();
  });

  test("opens dropdown and shows options", async ({ page }) => {
    const field = page.locator('[data-field-name="techStack"]');
    await field.getByRole("combobox").click();
    // The popover content has visible option items
    const popover = page.locator('[data-radix-popper-content-wrapper]');
    await expect(popover.getByRole("option", { name: "React" })).toBeVisible();
    await expect(popover.getByRole("option", { name: "TypeScript" })).toBeVisible();
    await expect(popover.getByRole("option", { name: "Node.js" })).toBeVisible();
    await expect(popover.getByRole("option", { name: "Python" })).toBeVisible();
  });

  test("selects multiple options and shows badges", async ({ page }) => {
    const field = page.locator('[data-field-name="techStack"]');
    await field.getByRole("combobox").click();
    const popover = page.locator('[data-radix-popper-content-wrapper]');
    await popover.getByRole("option", { name: "React" }).click();
    await popover.getByRole("option", { name: "TypeScript" }).click();
    // Close dropdown
    await page.keyboard.press("Escape");
    // Should show badges for selected items
    await expect(field.locator('[data-selected-item]').filter({ hasText: "React" })).toBeVisible();
    await expect(field.locator('[data-selected-item]').filter({ hasText: "TypeScript" })).toBeVisible();
  });

  test("deselects option on second click", async ({ page }) => {
    const field = page.locator('[data-field-name="techStack"]');
    await field.getByRole("combobox").click();
    const popover = page.locator('[data-radix-popper-content-wrapper]');
    // Select React
    await popover.getByRole("option", { name: "React" }).click();
    // Click again to deselect
    await popover.getByRole("option", { name: "React" }).click();
    await page.keyboard.press("Escape");
    // Should show placeholder again
    await expect(field.getByText("Select...")).toBeVisible();
  });
});
