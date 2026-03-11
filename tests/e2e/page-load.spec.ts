import { expect, test } from "@playwright/test";

test("canvas が正しいサイズで表示される", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("#display");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("width", "640");
  await expect(canvas).toHaveAttribute("height", "320");
});

test("UI コントロールが表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#rom-select")).toBeVisible();
  await expect(page.locator("#reset-btn")).toBeVisible();
  await expect(page.locator("#debug-toggle")).toBeVisible();
  await expect(page.locator("#status")).toHaveText("No ROM loaded");
});
