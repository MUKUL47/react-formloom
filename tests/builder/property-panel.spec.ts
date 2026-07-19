import { test, expect } from "@playwright/test";
import { goToBuilder, dragFieldToCanvas, selectFieldOnCanvas, getPropertyPanel, importSchema } from "./helpers";

test.describe("Builder: Property Panel", () => {
  test.beforeEach(async ({ page }) => {
    await goToBuilder(page);
    // Import a field so we have a known state
    await importSchema(page, {
      version: 1,
      fields: [{ id: "f1", name: "testInput", type: "input", label: "Test Input" }],
    });
    await selectFieldOnCanvas(page, "Test Input");
  });

  test("shows empty state when no field selected", async ({ page }) => {
    // Press Escape to deselect
    await page.keyboard.press("Escape");
    const panel = getPropertyPanel(page);
    await expect(panel.getByText("Select a field")).toBeVisible();
  });

  test("edit field label", async ({ page }) => {
    const panel = getPropertyPanel(page);
    const labelInput = panel.locator("input").first();
    await labelInput.fill("Full Name");
    // Canvas should update
    const canvas = page.locator(".bg-muted\\/30");
    await expect(canvas.getByText("Full Name")).toBeVisible();
  });

  test("edit placeholder", async ({ page }) => {
    const panel = getPropertyPanel(page);
    const placeholderInput = panel.getByPlaceholder("Input hint text");
    await placeholderInput.fill("Enter your name");
    // Bottom info bar shows placeholder
    await expect(page.getByText('"Enter your name"')).toBeVisible();
  });

  test("toggle required checkbox", async ({ page }) => {
    const panel = getPropertyPanel(page);
    const requiredCheckbox = panel.locator("#p-req");
    await requiredCheckbox.click();
    // Should show required indicator on canvas field info bar
    const canvas = page.locator(".bg-muted\\/30");
    await expect(canvas.getByText("required")).toBeVisible();
  });

  test("toggle read only checkbox", async ({ page }) => {
    const panel = getPropertyPanel(page);
    const roCheckbox = panel.locator("#p-ro");
    await roCheckbox.click();
    await expect(roCheckbox).toBeChecked();
  });

  test("edit help text", async ({ page }) => {
    const panel = getPropertyPanel(page);
    const helpInput = panel.getByPlaceholder("Description below label");
    await helpInput.fill("Your full legal name");
    await expect(helpInput).toHaveValue("Your full legal name");
  });

  test("edit tooltip", async ({ page }) => {
    const panel = getPropertyPanel(page);
    const tooltipInput = panel.getByPlaceholder("Hover info popup");
    await tooltipInput.fill("As per passport");
    await expect(tooltipInput).toHaveValue("As per passport");
  });
});
