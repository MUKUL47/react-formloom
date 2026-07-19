import { test, expect } from "@playwright/test";

test.describe("File upload field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("resume field renders upload area", async ({ page }) => {
    const field = page.locator('[data-field-name="resume"]');
    await field.scrollIntoViewIfNeeded();
    await expect(field.getByText("Resume")).toBeVisible();
  });

  test("uploads a valid file and shows filename", async ({ page }) => {
    const fileInput = page.locator('[data-field-name="resume"] input[type="file"]');
    await fileInput.setInputFiles({
      name: "my-resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("pdf content"),
    });
    await expect(page.getByText("my-resume.pdf")).toBeVisible();
  });

  test("rejects oversized file", async ({ page }) => {
    const fileInput = page.locator('[data-field-name="resume"] input[type="file"]');
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, "x");
    await fileInput.setInputFiles({
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: bigBuffer,
    });
    await expect(page.getByText(/exceeds 5MB/)).toBeVisible();
  });

  test("ID proof field allows multiple files", async ({ page }) => {
    const field = page.locator('[data-field-name="documents"]');
    await field.scrollIntoViewIfNeeded();
    const fileInput = field.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: "id1.jpg", mimeType: "image/jpeg", buffer: Buffer.from("1") },
      { name: "id2.jpg", mimeType: "image/jpeg", buffer: Buffer.from("2") },
    ]);
    await expect(field.getByText("id1.jpg")).toBeVisible();
    await expect(field.getByText("id2.jpg")).toBeVisible();
  });

  test("ID proof enforces max count of 3", async ({ page }) => {
    const field = page.locator('[data-field-name="documents"]');
    await field.scrollIntoViewIfNeeded();
    const fileInput = field.locator('input[type="file"]');
    await fileInput.setInputFiles([
      { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("1") },
      { name: "b.jpg", mimeType: "image/jpeg", buffer: Buffer.from("2") },
      { name: "c.jpg", mimeType: "image/jpeg", buffer: Buffer.from("3") },
      { name: "d.jpg", mimeType: "image/jpeg", buffer: Buffer.from("4") },
    ]);
    await expect(page.getByText(/dropped.*max 3/)).toBeVisible();
  });

  test("file can be removed", async ({ page }) => {
    const field = page.locator('[data-field-name="resume"]');
    await field.scrollIntoViewIfNeeded();
    const fileInput = field.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "removeme.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("x"),
    });
    await expect(field.getByText("removeme.pdf")).toBeVisible();
    // Click the remove button (X icon)
    await field.locator("button").filter({ has: page.locator("svg") }).click();
    await expect(field.getByText("removeme.pdf")).not.toBeVisible();
  });
});
