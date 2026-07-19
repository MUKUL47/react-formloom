import { type Page, expect } from "@playwright/test";

/** Navigate to builder tab and wait for it to load */
export async function goToBuilder(page: Page) {
  await page.goto("/");
  await page.getByTestId("tab-builder").click();
  await expect(page.getByTestId("builder-section")).toBeVisible();
  // Wait for palette to render
  await expect(page.getByText("Text Input")).toBeVisible();
}

/** Drag a field from the palette onto the canvas using mouse events */
export async function dragFieldToCanvas(page: Page, fieldLabel: string) {
  const palette = page.locator(".w-52"); // palette container
  const paletteItem = palette.getByText(fieldLabel, { exact: true });
  await expect(paletteItem).toBeVisible();

  const canvas = page.locator(".border-dashed").first();

  const srcBox = (await paletteItem.boundingBox())!;
  const dstBox = (await canvas.boundingBox())!;

  const srcX = srcBox.x + srcBox.width / 2;
  const srcY = srcBox.y + srcBox.height / 2;
  const dstX = dstBox.x + dstBox.width / 2;
  const dstY = dstBox.y + dstBox.height / 2;

  // @dnd-kit PointerSensor needs: pointerdown → move > 5px → move to target → pointerup
  await page.mouse.move(srcX, srcY);
  await page.mouse.down();
  // Move past activation constraint (5px)
  await page.mouse.move(srcX + 10, srcY, { steps: 3 });
  // Move to canvas center
  await page.mouse.move(dstX, dstY, { steps: 10 });
  await page.mouse.up();
}

/** Click a field on the canvas to select it.
 * The field preview is pointer-events-none so we click the parent container.
 */
export async function selectFieldOnCanvas(page: Page, fieldLabel: string) {
  const canvas = page.locator(".bg-muted\\/30");
  // Find the text, then click its closest .group container (the CanvasField wrapper)
  const fieldCard = canvas.locator(".group").filter({ hasText: fieldLabel }).first();
  await fieldCard.click();
}

/** Get the property panel (right sidebar) */
export function getPropertyPanel(page: Page) {
  return page.locator(".w-\\[360px\\].border-l");
}

/** Import a schema into the builder via the Import dialog */
export async function importSchema(page: Page, schema: object) {
  await page.getByRole("button", { name: "Import" }).click();
  await page.locator("textarea").fill(JSON.stringify(schema));
  await page.getByRole("button", { name: "Load Schema" }).click();
}

/** Save schema and switch to preview */
export async function saveAndPreview(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByTestId("tab-preview").click();
  await expect(page.getByTestId("preview-section")).toBeVisible();
}
