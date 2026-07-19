import { test, expect } from "@playwright/test";

test.describe("Tabs field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders tab buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Emergency Contact" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bank Details" })).toBeVisible();
  });

  test("first tab is active by default", async ({ page }) => {
    await expect(page.getByText("Contact Name")).toBeVisible();
  });

  test("switches to second tab", async ({ page }) => {
    await page.getByRole("button", { name: "Bank Details" }).click();
    await expect(page.getByText("Bank Name")).toBeVisible();
    await expect(page.getByText("IFSC Code")).toBeVisible();
  });

  test("preserves first tab values when switching", async ({ page }) => {
    // Fill Emergency Contact tab
    await page.locator('[data-field-name="emergencyName"] input').fill("Mom");
    await page.locator('[data-field-name="emergencyPhone"] input').fill("9876543210");

    // Switch to Bank Details
    await page.getByRole("button", { name: "Bank Details" }).click();

    // Switch back
    await page.getByRole("button", { name: "Emergency Contact" }).click();

    // Values should persist
    await expect(page.locator('[data-field-name="emergencyName"] input')).toHaveValue("Mom");
    await expect(page.locator('[data-field-name="emergencyPhone"] input')).toHaveValue("9876543210");
  });

  test("validates required fields in tabs on submit", async ({ page }) => {
    // Fill all top-level required fields but leave tab fields empty
    await page.getByPlaceholder("John Doe").fill("Tab Test");
    await page.getByPlaceholder("john@company.com").fill("t@c.com");
    await page.getByPlaceholder("Min 8 chars").fill("StrongPass1!");
    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Marketing" }).click();
    await page.getByText("Senior").click();
    await page.locator('[data-field-name="dateOfBirth"] input').fill("1990-01-15");
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "r.pdf", mimeType: "application/pdf", buffer: Buffer.from("x"),
    });
    await page.getByPlaceholder("Street").fill("S");
    await page.locator('[data-field-name="city"] input').fill("C");
    await page.locator('[data-field-name="pincode"] input').fill("123456");
    await page.getByText("I accept the NDA").click();

    await page.getByRole("button", { name: "Submit" }).click();

    // Should show error for tab fields
    await expect(page.getByText("This field is required").first()).toBeVisible();
  });

  test("emergency phone validates minLength", async ({ page }) => {
    await page.getByRole("button", { name: "Emergency Contact" }).click();
    const input = page.locator('[data-field-name="emergencyPhone"] input');
    await input.fill("123");
    await input.blur();
    await expect(page.getByText("Too short")).toBeVisible();
  });
});
