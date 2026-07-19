import { test, expect } from "@playwright/test";

test.describe("Divider field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  test("renders separator elements on page", async ({ page }) => {
    // Dividers render as <Separator> (role="none" or just an hr-like div)
    // Check that the divider wrappers exist between field groups
    const preview = page.getByTestId("preview-section");
    // There should be at least 3 separator elements rendered by dividers
    const separators = preview.locator('[role="none"]');
    const count = await separators.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("dividers are not included in submitted values", async ({ page }) => {
    // Quick submit with all required fields
    await page.getByPlaceholder("John Doe").fill("Div Test");
    await page.getByPlaceholder("john@company.com").fill("d@c.com");
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
    const text = await page.getByTestId("submitted-values").textContent();
    expect(text).not.toContain('"_div1"');
    expect(text).not.toContain('"_div2"');
    expect(text).not.toContain('"_div3"');
  });
});
