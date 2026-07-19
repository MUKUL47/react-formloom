import { test, expect } from "@playwright/test";
import { goToBuilder, importSchema, saveAndPreview } from "./helpers";

test.describe("Builder: Save and Preview", () => {
  test("build form and preview renders it", async ({ page }) => {
    await goToBuilder(page);

    // Import a simple form
    await importSchema(page, {
      version: 1,
      fields: [
        { id: "f1", name: "userName", type: "input", label: "User Name", placeholder: "Enter name", required: true },
        { id: "f2", name: "userEmail", type: "email", label: "User Email", placeholder: "you@example.com", required: true },
      ],
    });
    await expect(page.getByText("2 fields")).toBeVisible();

    // Save and go to preview
    await saveAndPreview(page);

    // Preview should render the built form
    await expect(page.getByPlaceholder("Enter name")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByText("User Name")).toBeVisible();
    await expect(page.getByText("User Email")).toBeVisible();
  });

  test("preview form validates required fields", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        { id: "f1", name: "name", type: "input", label: "Name", required: true },
      ],
    });
    await saveAndPreview(page);

    // Submit without filling
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("This field is required")).toBeVisible();
  });

  test("preview form submits successfully", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        { id: "f1", name: "greeting", type: "input", label: "Greeting", placeholder: "Say hi" },
      ],
    });
    await saveAndPreview(page);

    await page.getByPlaceholder("Say hi").fill("Hello World");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText('"greeting": "Hello World"')).toBeVisible();
  });

  test("preview form with select field", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "f1", name: "color", type: "select", label: "Favorite Color",
          options: [
            { label: "Red", value: "red" },
            { label: "Blue", value: "blue" },
            { label: "Green", value: "green" },
          ],
        },
      ],
    });
    await saveAndPreview(page);

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Blue" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText('"color": "blue"')).toBeVisible();
  });

  test("preview form with checkbox and switch", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        { id: "f1", name: "agree", type: "checkbox", label: "I agree" },
        { id: "f2", name: "notifications", type: "switch", label: "Enable notifications" },
      ],
    });
    await saveAndPreview(page);

    await page.getByText("I agree").click();
    await page.locator('button[role="switch"]').click();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText('"agree": true')).toBeVisible();
    await expect(page.getByText('"notifications": true')).toBeVisible();
  });

  test("preview form with validation rules", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "f1", name: "email", type: "email", label: "Email",
          validation: [{ type: "email", message: "Bad email" }],
        },
      ],
    });
    await saveAndPreview(page);

    const input = page.locator('[data-field-name="email"] input');
    await input.fill("not-email");
    await input.blur();
    await expect(page.getByText("Bad email")).toBeVisible();

    await input.fill("good@email.com");
    await input.blur();
    await expect(page.getByText("Bad email")).not.toBeVisible();
  });

  test("preview form with section container", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "s1", name: "details", type: "section", label: "Personal Details",
          children: [
            { id: "c1", name: "firstName", type: "input", label: "First Name" },
            { id: "c2", name: "lastName", type: "input", label: "Last Name" },
          ],
        },
      ],
    });
    await saveAndPreview(page);

    await expect(page.getByText("Personal Details")).toBeVisible();
    await expect(page.getByText("First Name")).toBeVisible();
    await expect(page.getByText("Last Name")).toBeVisible();
  });

  test("preview form with tabs container", async ({ page }) => {
    await goToBuilder(page);
    await importSchema(page, {
      version: 1,
      fields: [
        {
          id: "t1", name: "info", type: "tabs", label: "Info",
          tabs: [
            { key: "personal", label: "Personal", fields: [
              { id: "tp1", name: "fullName", type: "input", label: "Full Name" },
            ]},
            { key: "work", label: "Work", fields: [
              { id: "tw1", name: "company", type: "input", label: "Company" },
            ]},
          ],
        },
      ],
    });
    await saveAndPreview(page);

    await expect(page.getByRole("button", { name: "Personal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Work" })).toBeVisible();
    await expect(page.getByText("Full Name")).toBeVisible();

    await page.getByRole("button", { name: "Work" }).click();
    await expect(page.getByText("Company")).toBeVisible();
  });
});
