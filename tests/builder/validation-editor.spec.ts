import { test, expect } from "@playwright/test";
import { goToBuilder, importSchema, selectFieldOnCanvas, getPropertyPanel, saveAndPreview } from "./helpers";

test.describe("Builder: Validation Editor", () => {
  test("add required validation and verify in preview", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        { id: "f1", name: "testName", type: "input", label: "Test Name" },
      ],
    });
    await selectFieldOnCanvas(page, "Test Name");

    // Toggle required
    const panel = getPropertyPanel(page);
    await panel.locator("#p-req").click();

    // Save and preview
    await saveAndPreview(page);

    // Submit without filling — should show required error
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("This field is required")).toBeVisible();
  });

  test("add minLength validation rule and verify in preview", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "f1", name: "username", type: "input", label: "Username",
          validation: [{ type: "minLength", value: 3, message: "Too short!" }],
        },
      ],
    });
    await saveAndPreview(page);

    const input = page.locator('[data-field-name="username"] input');
    await input.fill("ab");
    await input.blur();
    await expect(page.getByText("Too short!")).toBeVisible();

    await input.fill("abc");
    await input.blur();
    await expect(page.getByText("Too short!")).not.toBeVisible();
  });

  test("email validation rule in preview", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "f1", name: "email", type: "email", label: "Email",
          validation: [{ type: "email", message: "Invalid email format" }],
        },
      ],
    });
    await saveAndPreview(page);

    const input = page.locator('[data-field-name="email"] input');
    await input.fill("bad");
    await input.blur();
    await expect(page.getByText("Invalid email format")).toBeVisible();
  });

  test("pattern validation rule in preview", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "f1", name: "zip", type: "input", label: "ZIP Code",
          validation: [{ type: "pattern", value: "^\\d{5}$", message: "Must be 5 digits" }],
        },
      ],
    });
    await saveAndPreview(page);

    const input = page.locator('[data-field-name="zip"] input');
    await input.fill("abc");
    await input.blur();
    await expect(page.getByText("Must be 5 digits")).toBeVisible();

    await input.fill("12345");
    await input.blur();
    await expect(page.getByText("Must be 5 digits")).not.toBeVisible();
  });
});
