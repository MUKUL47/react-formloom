import { test, expect } from "@playwright/test";

test.describe("Input field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with placeholder", async ({ page }) => {
    const input = page.getByPlaceholder("John Doe");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "text");
  });

  test("accepts text input", async ({ page }) => {
    const input = page.getByPlaceholder("John Doe");
    await input.fill("Jane Smith");
    await expect(input).toHaveValue("Jane Smith");
  });

  test("validates minLength", async ({ page }) => {
    const input = page.getByPlaceholder("John Doe");
    await input.fill("A");
    await input.blur();
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
  });

  test("clears minLength error when valid", async ({ page }) => {
    const input = page.getByPlaceholder("John Doe");
    await input.fill("A");
    await input.blur();
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();

    await input.fill("Alice");
    await input.blur();
    await expect(page.getByText("Name must be at least 2 characters")).not.toBeVisible();
  });

  test("shows required error when empty on submit", async ({ page }) => {
    await page.getByRole("button", { name: "Submit" }).click();
    const field = page.locator('[data-field-name="fullName"]');
    await expect(field.getByText("This field is required")).toBeVisible();
  });
});
