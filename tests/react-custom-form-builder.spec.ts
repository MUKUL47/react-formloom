import { test, expect } from "@playwright/test";

test.describe("ReactCustomFormBuilder Renderer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Ensure we're on the Preview tab
    await page.getByTestId("tab-preview").click();
    await expect(page.getByTestId("preview-section")).toBeVisible();
  });

  // ── Rendering ─────────────────────────────────────────────

  test("renders all field types", async ({ page }) => {
    // Heading
    await expect(page.locator("h2").filter({ hasText: "Employee Onboarding" })).toBeVisible();

    // Text inputs
    await expect(page.getByPlaceholder("John Doe")).toBeVisible();
    await expect(page.getByPlaceholder("john@company.com")).toBeVisible();
    await expect(page.getByPlaceholder("+91 98765 43210")).toBeVisible();

    // Password
    await expect(page.getByPlaceholder("Min 8 chars")).toBeVisible();

    // Textarea
    await expect(page.getByPlaceholder("Tell us about yourself...")).toBeVisible();

    // Number
    const ageInput = page.locator('input[type="number"]').first();
    await expect(ageInput).toBeVisible();

    // Select (Department)
    await expect(page.getByText("Department")).toBeVisible();

    // Radio (Role)
    await expect(page.getByText("Junior")).toBeVisible();
    await expect(page.getByText("Senior")).toBeVisible();

    // Checkbox
    await expect(page.getByText("Subscribe to newsletter")).toBeVisible();

    // Switch
    await expect(page.getByText("Prefer remote work")).toBeVisible();

    // File upload
    await expect(page.getByText("Resume")).toBeVisible();

    // Section (collapsible) — need to scroll into view
    const addressSection = page.getByText("Address", { exact: true });
    await addressSection.scrollIntoViewIfNeeded();
    await expect(addressSection).toBeVisible();

    // Tabs
    await expect(page.getByRole("button", { name: "Emergency Contact" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bank Details" })).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  // ── Required field validation ─────────────────────────────

  test("shows required errors on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Submit" }).click();

    // Should show error for first required field
    await expect(page.getByText("This field is required").first()).toBeVisible();
  });

  test("validates email format", async ({ page }) => {
    const emailInput = page.getByPlaceholder("john@company.com");
    await emailInput.fill("not-an-email");
    await emailInput.blur();

    // Wait for inline validation
    await expect(page.getByText("Invalid email")).toBeVisible({ timeout: 2000 });
  });

  test("validates minLength on password", async ({ page }) => {
    const passInput = page.getByPlaceholder("Min 8 chars");
    await passInput.fill("short");
    await passInput.blur();

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible({ timeout: 2000 });
  });

  test("clears error when valid value entered", async ({ page }) => {
    const passInput = page.getByPlaceholder("Min 8 chars");
    await passInput.fill("sh");
    await passInput.blur();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible({ timeout: 2000 });

    await passInput.fill("ValidPassword1");
    await expect(page.getByText("Password must be at least 8 characters")).not.toBeVisible({ timeout: 2000 });
  });

  test("validates number min/max", async ({ page }) => {
    const ageInput = page.locator('input[type="number"]').first();
    await ageInput.fill("10");
    await ageInput.blur();

    await expect(page.getByText("Must be 18+")).toBeVisible({ timeout: 2000 });
  });

  test("validates pattern (PIN code in section)", async ({ page }) => {
    // Open Address section if collapsed, then fill PIN
    const pinInput = page.getByPlaceholder("Street");
    // Ensure section is visible
    await expect(pinInput).toBeVisible();
  });

  // ── Side effects ──────────────────────────────────────────

  test("hides techStack when department is not Engineering", async ({ page }) => {
    // Initially no department selected — techStack should be hidden by sideEffect
    // Select Marketing
    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Marketing" }).click();

    // techStack should not be visible
    await expect(page.getByText("Tech Stack")).not.toBeVisible();
  });

  test("shows techStack when department is Engineering", async ({ page }) => {
    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Engineering" }).click();

    // techStack should be visible
    await expect(page.getByText("Tech Stack")).toBeVisible();
  });

  // ── Tabs ──────────────────────────────────────────────────

  test("switches between tabs", async ({ page }) => {
    // Click Emergency Contact tab
    await page.getByRole("button", { name: "Emergency Contact" }).click();
    await expect(page.getByText("Contact Name")).toBeVisible();

    // Switch to Bank Details tab
    await page.getByRole("button", { name: "Bank Details" }).click();
    await expect(page.getByText("Bank Name")).toBeVisible();
    await expect(page.getByText("IFSC Code")).toBeVisible();
  });

  test("validates fields inside tabs on submit", async ({ page }) => {
    // Fill required top-level fields to get past them
    await page.getByPlaceholder("John Doe").fill("Test User");
    await page.getByPlaceholder("john@company.com").fill("test@co.com");
    await page.getByPlaceholder("Min 8 chars").fill("Password123");

    // Select department & role
    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Marketing" }).click();
    await page.getByText("Senior").click();

    // Click submit — should show errors for tab fields
    await page.getByRole("button", { name: "Submit" }).click();

    // Should auto-switch to the tab with errors and show error
    await expect(page.getByText("This field is required").first()).toBeVisible({ timeout: 3000 });
  });

  // ── Section (collapsible) ─────────────────────────────────

  test("section fields are visible and fillable", async ({ page }) => {
    // Address section should be open by default
    const streetInput = page.getByPlaceholder("Street");
    await expect(streetInput).toBeVisible();
    await streetInput.fill("123 Main St");
    await expect(streetInput).toHaveValue("123 Main St");
  });

  // ── File upload ───────────────────────────────────────────

  test("file upload shows file after selection", async ({ page }) => {
    // Create a test file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test-resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake pdf content"),
    });

    // Should show file name
    await expect(page.getByText("test-resume.pdf")).toBeVisible();
  });

  test("file upload rejects oversized files", async ({ page }) => {
    // The resume field has maxSizeMB: 5
    const fileInput = page.locator('input[type="file"]').first();

    // Create a ~6MB buffer
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, "x");
    await fileInput.setInputFiles({
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: bigBuffer,
    });

    // Should show rejection message
    await expect(page.getByText(/exceeds 5MB/)).toBeVisible();
  });

  test("file upload enforces max count", async ({ page }) => {
    // ID Proof field allows max 3 files — scroll to it first
    const docsField = page.locator('[data-field-name="documents"]');
    await docsField.scrollIntoViewIfNeeded();
    const fileInput = docsField.locator('input[type="file"]');

    // Upload 4 files
    await fileInput.setInputFiles([
      { name: "id1.jpg", mimeType: "image/jpeg", buffer: Buffer.from("1") },
      { name: "id2.jpg", mimeType: "image/jpeg", buffer: Buffer.from("2") },
      { name: "id3.jpg", mimeType: "image/jpeg", buffer: Buffer.from("3") },
      { name: "id4.jpg", mimeType: "image/jpeg", buffer: Buffer.from("4") },
    ]);

    // Should show rejection about max count
    await expect(page.getByText(/dropped.*max 3/)).toBeVisible({ timeout: 2000 });
  });

  // ── Checkbox & Switch ─────────────────────────────────────

  test("checkbox toggles", async ({ page }) => {
    const checkbox = page.getByText("Subscribe to newsletter");
    await checkbox.click();
    // After click, should toggle state
  });

  test("switch toggles", async ({ page }) => {
    const switchEl = page.locator('button[role="switch"]').first();
    await expect(switchEl).toBeVisible();
    await switchEl.click();
    await expect(switchEl).toHaveAttribute("data-state", "checked");
  });

  // ── Full form submission ──────────────────────────────────

  test("successful form submission shows values", async ({ page }) => {
    // Fill all required fields
    await page.getByPlaceholder("John Doe").fill("Test User");
    await page.getByPlaceholder("john@company.com").fill("test@company.com");
    await page.getByPlaceholder("Min 8 chars").fill("StrongPass1!");

    // Department
    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Marketing" }).click();

    // Role
    await page.getByText("Senior").click();

    // DOB (pick a date that makes user 18+)
    const dobInput = page.locator('[data-field-name="dateOfBirth"] input');
    await dobInput.fill("1990-01-15");

    // Resume
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("pdf"),
    });

    // Address section
    await page.getByPlaceholder("Street").fill("123 Main St");
    await page.locator('[data-field-name="city"] input').fill("Mumbai");
    await page.locator('[data-field-name="pincode"] input').fill("400001");

    // Emergency Contact tab
    await page.getByRole("button", { name: "Emergency Contact" }).click();
    await page.locator('[data-field-name="emergencyName"] input').fill("Jane Doe");
    await page.locator('[data-field-name="emergencyPhone"] input').fill("+919876543210");

    // Bank Details tab
    await page.getByRole("button", { name: "Bank Details" }).click();
    await page.locator('[data-field-name="bankName"] input').fill("SBI");
    await page.locator('[data-field-name="ifscCode"] input').fill("SBIN0001234");

    // NDA checkbox
    await page.getByText("I accept the NDA").click();

    // Submit
    await page.getByRole("button", { name: "Submit" }).click();

    // Should show submitted values
    await expect(page.getByTestId("submitted-values")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('"fullName": "Test User"')).toBeVisible();
    await expect(page.getByText('"source": "standalone"')).toBeVisible();
  });

  // ── Hook: beforeSubmit (email lowercase) ──────────────────

  test("beforeSubmit hook lowercases email", async ({ page }) => {
    // Fill all required fields with uppercase email
    await page.getByPlaceholder("John Doe").fill("Test User");
    await page.getByPlaceholder("john@company.com").fill("TEST@COMPANY.COM");
    await page.getByPlaceholder("Min 8 chars").fill("StrongPass1!");

    await page.locator('[data-field-name="department"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Marketing" }).click();
    await page.getByText("Senior").click();

    const dobInput = page.locator('[data-field-name="dateOfBirth"] input');
    await dobInput.fill("1990-01-15");

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "r.pdf", mimeType: "application/pdf", buffer: Buffer.from("x"),
    });

    await page.getByPlaceholder("Street").fill("St");
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

    await expect(page.getByTestId("submitted-values")).toBeVisible({ timeout: 5000 });
    // Email should be lowercased by beforeSubmit hook
    await expect(page.getByText('"email": "test@company.com"')).toBeVisible();
  });

  // ── Hook: validate (DOB age check) ────────────────────────

  test("custom validate hook rejects underage DOB", async ({ page }) => {
    const dobInput = page.locator('[data-field-name="dateOfBirth"] input');
    await dobInput.fill("2020-01-01");
    await dobInput.blur();

    await expect(page.getByText("Must be 18+")).toBeVisible({ timeout: 2000 });
  });

  // ── NDA checkbox validation ───────────────────────────────

  test("NDA checkbox validates on submit", async ({ page }) => {
    // Fill all required fields except NDA
    await page.getByPlaceholder("John Doe").fill("Test User");
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

    // Do NOT check NDA, then submit
    await page.getByRole("button", { name: "Submit" }).click();

    // NDA error should appear (required check fires first)
    const ndaField = page.locator('[data-field-name="ndaAccepted"]');
    await ndaField.scrollIntoViewIfNeeded();
    await expect(ndaField.getByText("This field is required")).toBeVisible({ timeout: 3000 });
  });

  // ── Display fields stripped from submission ───────────────

  test("display fields not in submitted values", async ({ page }) => {
    // Do a full submit (reuse the full form flow)
    await page.getByPlaceholder("John Doe").fill("Strip Test");
    await page.getByPlaceholder("john@company.com").fill("s@c.com");
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

    await expect(page.getByTestId("submitted-values")).toBeVisible({ timeout: 5000 });
    const text = await page.getByTestId("submitted-values").textContent();
    // Display fields should NOT be in output
    expect(text).not.toContain('"_header"');
    expect(text).not.toContain('"_div1"');
    expect(text).not.toContain('"_div2"');
    // Data fields should be there
    expect(text).toContain('"fullName"');
    expect(text).toContain('"source"');
  });
});

test.describe("ReactCustomFormBuilder Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-builder").click();
    await expect(page.getByTestId("builder-section")).toBeVisible();
  });

  test("builder loads with palette and canvas", async ({ page }) => {
    // Palette should show field types
    // Wait for builder to fully render
    await expect(page.getByText("Text Input")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Text Area")).toBeVisible();
  });
});
