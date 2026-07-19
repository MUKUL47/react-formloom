import { test, expect } from "@playwright/test";

test.describe("Hidden field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("hidden field is not visible in the form", async ({ page }) => {
    // The hidden field renders as input[type="hidden"] — not visible on page
    const hiddenInput = page.locator('input[type="hidden"][name="source"]');
    await expect(hiddenInput).toHaveCount(1);
    await expect(hiddenInput).not.toBeVisible();
  });

  test("hidden field value is included in submission", async ({ page }) => {
    // Fill all required fields
    await page.getByPlaceholder("John Doe").fill("Hidden Test");
    await page.getByPlaceholder("john@company.com").fill("h@c.com");
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
    await page.getByText("I accept the NDA").click();
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByTestId("submitted-values")).toBeVisible();
    await expect(page.getByText('"source": "standalone"')).toBeVisible();
  });
});
