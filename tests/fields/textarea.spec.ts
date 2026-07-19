import { test, expect } from "@playwright/test";

test.describe("Textarea field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with placeholder", async ({ page }) => {
    const textarea = page.getByPlaceholder("Tell us about yourself...");
    await expect(textarea).toBeVisible();
  });

  test("accepts multi-line text", async ({ page }) => {
    const textarea = page.getByPlaceholder("Tell us about yourself...");
    await textarea.fill("Line one\nLine two\nLine three");
    await expect(textarea).toHaveValue("Line one\nLine two\nLine three");
  });

  test("validates maxLength", async ({ page }) => {
    const textarea = page.getByPlaceholder("Tell us about yourself...");
    // Fill with more than 200 characters
    const longText = "a".repeat(201);
    await textarea.fill(longText);
    await textarea.blur();
    await expect(page.getByText("Max 200 characters")).toBeVisible();
  });

  test("clears maxLength error when shortened", async ({ page }) => {
    const textarea = page.getByPlaceholder("Tell us about yourself...");
    await textarea.fill("a".repeat(201));
    await textarea.blur();
    await expect(page.getByText("Max 200 characters")).toBeVisible();

    await textarea.fill("Short bio");
    await textarea.blur();
    await expect(page.getByText("Max 200 characters")).not.toBeVisible();
  });
});
