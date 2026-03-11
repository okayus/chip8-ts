import { expect, test } from "@playwright/test";

test("Debug パネルの表示/非表示が切り替わる", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("#debug-panel");

  await expect(panel).not.toHaveClass(/visible/);

  await page.click("#debug-toggle");
  await expect(panel).toHaveClass(/visible/);
  await expect(page.locator("#debug-toggle")).toHaveText("Hide Debug");

  await page.click("#debug-toggle");
  await expect(panel).not.toHaveClass(/visible/);
  await expect(page.locator("#debug-toggle")).toHaveText("Debug");
});

test("ROM 実行中にレジスタ値が表示される", async ({ page }) => {
  await page.goto("/");
  await page.click("#debug-toggle");
  await page.selectOption("#rom-select", "roms/PONG.ch8");
  await page.waitForTimeout(300);

  const regText = await page.locator("#debug-registers").textContent();
  expect(regText).toContain("V0:");
  expect(regText).toContain("VF:");

  const metaText = await page.locator("#debug-meta").textContent();
  expect(metaText).toContain("PC:");
  expect(metaText).toContain("SP:");
  expect(metaText).toContain("DT:");
  expect(metaText).toContain("ST:");
});
