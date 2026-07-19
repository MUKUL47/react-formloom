import { test, expect } from "@playwright/test";
import { goToBuilder, importSchema, saveAndPreview } from "./helpers";

/**
 * Tests that each field type can be built and rendered correctly in preview.
 */
test.describe("Builder: Build and Preview each field type", () => {

  test("input field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "fullName", type: "input", label: "Full Name", placeholder: "John Doe" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
  });

  test("textarea field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "bio", type: "textarea", label: "Bio", placeholder: "Tell us..." },
    ]});
    await saveAndPreview(page);
    await expect(page.getByPlaceholder("Tell us...")).toBeVisible();
  });

  test("number field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "age", type: "number", label: "Age" },
    ]});
    await saveAndPreview(page);
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test("email field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "email", type: "email", label: "Email", placeholder: "a@b.com" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByPlaceholder("a@b.com")).toBeVisible();
  });

  test("phone field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "phone", type: "phone", label: "Phone", placeholder: "+1 555" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByPlaceholder("+1 555")).toBeVisible();
  });

  test("url field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "site", type: "url", label: "Website", placeholder: "https://..." },
    ]});
    await saveAndPreview(page);
    await expect(page.getByPlaceholder("https://...")).toBeVisible();
  });

  test("password field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "pass", type: "password", label: "Password", placeholder: "secret" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByPlaceholder("secret")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("slider field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "rating", type: "slider", label: "Rating", defaultValue: 5, props: { min: 0, max: 10 } },
    ]});
    await saveAndPreview(page);
    await expect(page.locator('[role="slider"]')).toBeVisible();
    await expect(page.getByText("5")).toBeVisible();
  });

  test("select field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "dept", type: "select", label: "Department",
        options: [{ label: "HR", value: "hr" }, { label: "Eng", value: "eng" }] },
    ]});
    await saveAndPreview(page);
    await page.getByRole("combobox").click();
    await expect(page.getByRole("option", { name: "HR" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Eng" })).toBeVisible();
  });

  test("radio field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "size", type: "radio", label: "Size",
        options: [{ label: "Small", value: "s" }, { label: "Large", value: "l" }] },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("Small")).toBeVisible();
    await expect(page.getByText("Large")).toBeVisible();
  });

  test("checkbox field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "agree", type: "checkbox", label: "I agree to terms" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("I agree to terms")).toBeVisible();
    await expect(page.locator('button[role="checkbox"]')).toBeVisible();
  });

  test("switch field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "dark", type: "switch", label: "Dark mode" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("Dark mode")).toBeVisible();
    await expect(page.locator('button[role="switch"]')).toBeVisible();
  });

  test("datePicker field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "dob", type: "datePicker", label: "Date of Birth" },
    ]});
    await saveAndPreview(page);
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("timePicker field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "time", type: "timePicker", label: "Meeting Time" },
    ]});
    await saveAndPreview(page);
    await expect(page.locator('input[type="time"]')).toBeVisible();
  });

  test("dateRange field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "dates", type: "dateRange", label: "Trip Dates" },
    ]});
    await saveAndPreview(page);
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
  });

  test("file upload field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "doc", type: "file", label: "Document", props: { accept: ".pdf" } },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("Document")).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
  });

  test("heading field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "_hdr", type: "heading", label: "Welcome Form", props: { level: "h2" } },
    ]});
    await saveAndPreview(page);
    await expect(page.locator("h2").filter({ hasText: "Welcome Form" })).toBeVisible();
  });

  test("paragraph field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "_para", type: "paragraph", label: "Please fill out this form carefully." },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("Please fill out this form carefully.")).toBeVisible();
  });

  test("divider field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "name", type: "input", label: "Name" },
      { id: "f2", name: "_div", type: "divider", label: "" },
      { id: "f3", name: "email", type: "email", label: "Email" },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("Name")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    // Separator should be rendered
    await expect(page.locator('[role="none"]').first()).toBeVisible();
  });

  test("hidden field included in submission", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      { id: "f1", name: "visible", type: "input", label: "Visible" },
      { id: "f2", name: "secret", type: "hidden", label: "Secret", defaultValue: "hidden-val" },
    ]});
    await saveAndPreview(page);

    await page.locator('[data-field-name="visible"] input').fill("test");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText('"secret": "hidden-val"')).toBeVisible();
    await expect(page.getByText('"visible": "test"')).toBeVisible();
  });

  test("section field with children", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      {
        id: "s1", name: "addr", type: "section", label: "Address",
        children: [
          { id: "c1", name: "street", type: "input", label: "Street" },
          { id: "c2", name: "city", type: "input", label: "City" },
        ],
      },
    ]});
    await saveAndPreview(page);
    await expect(page.getByText("Address")).toBeVisible();
    await expect(page.getByText("Street")).toBeVisible();
    await expect(page.getByText("City")).toBeVisible();
  });

  test("tabs field with multiple tabs", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, { version: 1, fields: [
      {
        id: "t1", name: "contact", type: "tabs", label: "Contact",
        tabs: [
          { key: "home", label: "Home", fields: [
            { id: "h1", name: "homePhone", type: "phone", label: "Home Phone" },
          ]},
          { key: "work", label: "Work", fields: [
            { id: "w1", name: "workPhone", type: "phone", label: "Work Phone" },
          ]},
        ],
      },
    ]});
    await saveAndPreview(page);
    await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Work" })).toBeVisible();
    await expect(page.getByText("Home Phone")).toBeVisible();

    await page.getByRole("button", { name: "Work" }).click();
    await expect(page.getByText("Work Phone")).toBeVisible();
  });
});
