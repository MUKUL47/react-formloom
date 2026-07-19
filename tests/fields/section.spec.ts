import { test, expect } from "@playwright/test";

test.describe("Section field (collapsible)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("section is expanded by default", async ({ page }) => {
    // Children should be visible (section starts expanded)
    await expect(page.getByPlaceholder("Street")).toBeVisible();
  });

  test("collapses when header is clicked", async ({ page }) => {
    // The section label "Address" acts as the collapsible trigger
    const sectionHeader = page.getByText("Address", { exact: true });
    await sectionHeader.scrollIntoViewIfNeeded();
    await sectionHeader.click();

    // Children should be hidden
    await expect(page.getByPlaceholder("Street")).not.toBeVisible();
  });

  test("expands again when header is clicked twice", async ({ page }) => {
    const sectionHeader = page.getByText("Address", { exact: true });
    await sectionHeader.scrollIntoViewIfNeeded();

    // Collapse
    await sectionHeader.click();
    await expect(page.getByPlaceholder("Street")).not.toBeVisible();

    // Expand
    await sectionHeader.click();
    await expect(page.getByPlaceholder("Street")).toBeVisible();
  });

  test("children values persist after collapse/expand", async ({ page }) => {
    const streetInput = page.getByPlaceholder("Street");
    await streetInput.scrollIntoViewIfNeeded();
    await streetInput.fill("456 Oak Ave");

    const sectionHeader = page.getByText("Address", { exact: true });
    // Collapse
    await sectionHeader.click();
    await expect(page.getByPlaceholder("Street")).not.toBeVisible();
    // Expand
    await sectionHeader.click();
    await expect(page.getByPlaceholder("Street")).toBeVisible();

    await expect(streetInput).toHaveValue("456 Oak Ave");
  });
});
