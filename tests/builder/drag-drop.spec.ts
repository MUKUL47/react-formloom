import { test, expect } from "@playwright/test";
import { goToBuilder, dragFieldToCanvas, selectFieldOnCanvas } from "./helpers";

test.describe("Builder: Drag and Drop", () => {
  test.beforeEach(async ({ page }) => {
    await goToBuilder(page);
  });

  test("drag text input from palette to canvas", async ({ page }) => {
    await dragFieldToCanvas(page, "Text Input");
    // Field should appear on canvas
    const canvas = page.locator(".bg-muted\\/30");
    await expect(canvas.getByText("Text Input")).toBeVisible();
    // Field count should update
    await expect(page.getByText(/1 field/)).toBeVisible();
  });

  test("drag multiple fields to canvas", async ({ page }) => {
    await dragFieldToCanvas(page, "Text Input");
    await dragFieldToCanvas(page, "Email");
    await dragFieldToCanvas(page, "Number");
    await expect(page.getByText(/3 field/)).toBeVisible();
  });

  test("select a field on canvas shows property panel", async ({ page }) => {
    await dragFieldToCanvas(page, "Text Input");
    // After drag, field is auto-selected. Click it to ensure selection.
    await selectFieldOnCanvas(page, "Text Input");
    const panel = page.locator(".w-\\[360px\\].border-l");
    await expect(panel.getByText("Text Input")).toBeVisible();
    await expect(panel.getByText("Field Config")).toBeVisible();
  });

  test("delete field via delete button", async ({ page }) => {
    await dragFieldToCanvas(page, "Text Input");
    // Field should be auto-selected after drag; if not, select it
    await selectFieldOnCanvas(page, "Text Input");
    await page.getByTitle("Delete").click();
    await expect(page.getByText(/0 field/)).toBeVisible();
  });

  test("duplicate field via duplicate button", async ({ page }) => {
    await dragFieldToCanvas(page, "Text Input");
    await selectFieldOnCanvas(page, "Text Input");
    await page.getByTitle("Duplicate").click();
    await expect(page.getByText(/2 field/)).toBeVisible();
  });
});
