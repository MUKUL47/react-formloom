import { test, expect } from "@playwright/test";
import { goToBuilder, dragFieldToCanvas, selectFieldOnCanvas, importSchema } from "./helpers";

test.describe("Builder: Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await goToBuilder(page);
  });

  test("undo/redo buttons work", async ({ page }) => {
    // Initially undo disabled
    const undoBtn = page.getByTitle("Undo (Ctrl+Z)");
    await expect(undoBtn).toBeDisabled();

    // DnD creates an undo-able ADD_FIELD action (LOAD_SCHEMA resets history)
    await dragFieldToCanvas(page, "Text Input");
    await expect(page.getByText(/1 field/)).toBeVisible();

    // Undo should be enabled now
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await expect(page.getByText(/0 field/)).toBeVisible();

    // Redo should work
    const redoBtn = page.getByTitle("Redo (Ctrl+Shift+Z)");
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click();
    await expect(page.getByText(/1 field/)).toBeVisible();
  });

  test("JSON viewer toggle", async ({ page }) => {
    await dragFieldToCanvas(page, "Text Input");
    // Click JSON button
    await page.getByRole("button", { name: "JSON" }).click();
    // Should show JSON with schema
    await expect(page.locator("pre").filter({ hasText: '"version": 1' })).toBeVisible();
    // Toggle off
    await page.getByRole("button", { name: "JSON" }).click();
    await expect(page.locator("pre").filter({ hasText: '"version": 1' })).not.toBeVisible();
  });

  test("import schema via dialog", async ({ page }) => {
    const schema = {
      version: 1,
      fields: [
        { id: "f1", name: "testField", type: "input", label: "Test Field" },
        { id: "f2", name: "testEmail", type: "email", label: "Test Email" },
      ],
    };
    await page.getByRole("button", { name: "Import" }).click();
    await expect(page.getByText("Import Schema")).toBeVisible();
    await page.locator("textarea").fill(JSON.stringify(schema));
    await page.getByRole("button", { name: "Load Schema" }).click();

    // Fields should appear
    await expect(page.getByText(/2 field/)).toBeVisible();
    const canvas = page.locator(".bg-muted\\/30");
    await expect(canvas.getByText("Test Field")).toBeVisible();
    await expect(canvas.getByText("Test Email")).toBeVisible();
  });

  test("import rejects invalid JSON", async ({ page }) => {
    await page.getByRole("button", { name: "Import" }).click();
    await page.locator("textarea").fill("not json");
    await page.getByRole("button", { name: "Load Schema" }).click();
    await expect(page.getByText(/Invalid JSON/)).toBeVisible();
  });

  test("import rejects schema without fields array", async ({ page }) => {
    await page.getByRole("button", { name: "Import" }).click();
    await page.locator("textarea").fill('{"version": 1}');
    await page.getByRole("button", { name: "Load Schema" }).click();
    await expect(page.getByText(/Invalid schema/)).toBeVisible();
  });

  test("save button disabled when no fields", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  test("field count updates correctly", async ({ page }) => {
    await expect(page.getByText(/0 field/)).toBeVisible();
    await dragFieldToCanvas(page, "Text Input");
    await expect(page.getByText(/1 field/)).toBeVisible();
    await dragFieldToCanvas(page, "Email");
    await expect(page.getByText(/2 field/)).toBeVisible();
  });
});
