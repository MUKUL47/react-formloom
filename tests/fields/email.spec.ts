import { test, expect } from "@playwright/test";

test.describe("Email field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders with placeholder", async ({ page }) => {
    const input = page.getByPlaceholder("john@company.com");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "email");
  });

  test("accepts valid email", async ({ page }) => {
    const input = page.getByPlaceholder("john@company.com");
    await input.fill("user@example.com");
    await input.blur();
    await expect(page.getByText("Invalid email")).not.toBeVisible();
  });

  test("rejects invalid email", async ({ page }) => {
    const input = page.getByPlaceholder("john@company.com");
    await input.fill("not-an-email");
    await input.blur();
    await expect(page.getByText("Invalid email")).toBeVisible();
  });

  test("clears error when corrected", async ({ page }) => {
    const input = page.getByPlaceholder("john@company.com");
    await input.fill("bad");
    await input.blur();
    await expect(page.getByText("Invalid email")).toBeVisible();

    await input.fill("good@email.com");
    await input.blur();
    await expect(page.getByText("Invalid email")).not.toBeVisible();
  });

  test("shows required error on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Submit" }).click();
    const field = page.locator('[data-field-name="email"]');
    await expect(field.getByText("This field is required")).toBeVisible();
  });
});
