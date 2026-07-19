import { test, expect } from "@playwright/test";
import { goToBuilder } from "./helpers";

test.describe("Builder: Palette", () => {
  test.beforeEach(async ({ page }) => {
    await goToBuilder(page);
  });

  test("displays all field categories", async ({ page }) => {
    const palette = page.locator(".w-52");
    await expect(palette.getByText("Input Fields")).toBeVisible();
    await expect(palette.getByText("Selection Fields")).toBeVisible();
    await expect(palette.getByText("Layout & Structure")).toBeVisible();
    await expect(palette.getByText("Display")).toBeVisible();
  });

  test("displays input field types", async ({ page }) => {
    const palette = page.locator(".w-52");
    await expect(palette.getByText("Text Input")).toBeVisible();
    await expect(palette.getByText("Text Area")).toBeVisible();
    await expect(palette.getByText("Number")).toBeVisible();
    await expect(palette.getByText("Email")).toBeVisible();
    await expect(palette.getByText("Phone")).toBeVisible();
    await expect(palette.getByText("Password")).toBeVisible();
    await expect(palette.getByText("URL")).toBeVisible();
  });

  test("displays selection field types", async ({ page }) => {
    const palette = page.locator(".w-52");
    await expect(palette.getByText("Dropdown")).toBeVisible();
    await expect(palette.getByText("Multi Select")).toBeVisible();
    await expect(palette.getByText("Radio")).toBeVisible();
    await expect(palette.getByText("Checkbox")).toBeVisible();
    await expect(palette.getByText("Switch")).toBeVisible();
  });

  test("displays layout field types", async ({ page }) => {
    const palette = page.locator(".w-52");
    await expect(palette.getByText("Section")).toBeVisible();
    await expect(palette.getByText("Tabs")).toBeVisible();
    await expect(palette.getByText("Divider")).toBeVisible();
  });

  test("search filters fields", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search fields...");
    await searchInput.fill("email");
    const palette = page.locator(".w-52");
    await expect(palette.getByText("Email")).toBeVisible();
    // Other fields should not be visible
    await expect(palette.getByText("Text Input")).not.toBeVisible();
    await expect(palette.getByText("Number")).not.toBeVisible();
  });

  test("search shows no results message", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search fields...");
    await searchInput.fill("xyznonexistent");
    await expect(page.getByText(/No fields match/)).toBeVisible();
  });

  test("clearing search restores all fields", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search fields...");
    await searchInput.fill("email");
    await expect(page.locator(".w-52").getByText("Text Input")).not.toBeVisible();
    await searchInput.fill("");
    await expect(page.locator(".w-52").getByText("Text Input")).toBeVisible();
  });
});
