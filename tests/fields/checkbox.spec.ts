import { test, expect } from "@playwright/test";

test.describe("Checkbox field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("newsletter checkbox renders with default checked", async ({ page }) => {
    const field = page.locator('[data-field-name="newsletter"]');
    const checkbox = field.locator('button[role="checkbox"]');
    await expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  test("toggles checkbox off and on", async ({ page }) => {
    const field = page.locator('[data-field-name="newsletter"]');
    const checkbox = field.locator('button[role="checkbox"]');
    // Uncheck
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-state", "unchecked");
    // Check again
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  test("NDA checkbox shows required error", async ({ page }) => {
    // Submit without checking NDA
    await page.getByPlaceholder("John Doe").fill("Test");
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
    await page.getByRole("button", { name: "Emergency Contact" }).click();
    await page.locator('[data-field-name="emergencyName"] input').fill("E");
    await page.locator('[data-field-name="emergencyPhone"] input').fill("1234567890");
    await page.getByRole("button", { name: "Bank Details" }).click();
    await page.locator('[data-field-name="bankName"] input').fill("B");
    await page.locator('[data-field-name="ifscCode"] input').fill("SBIN0001234");
    await page.getByRole("button", { name: "Submit" }).click();

    const ndaField = page.locator('[data-field-name="ndaAccepted"]');
    await ndaField.scrollIntoViewIfNeeded();
    await expect(ndaField.getByText("This field is required")).toBeVisible();
  });
});
