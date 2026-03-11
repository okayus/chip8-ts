import { expect, test } from "@playwright/test";

test("MAZE ROM が画面を迷路パターンで埋める", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#rom-select", "roms/MAZE.ch8");
  await expect(page.locator("#status")).toContainText("MAZE.ch8");

  // MAZE は高速に画面を埋める — 2秒で十分
  await page.waitForTimeout(2000);

  const coverage = await page.evaluate(() => {
    const canvas = document.getElementById("display") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const scale = 10;
    const w = 64;
    const h = 32;
    let litPixels = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x * scale + scale / 2;
        const py = y * scale + scale / 2;
        const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
        if (r > 0 || g > 0 || b > 0) litPixels++;
      }
    }
    return litPixels / (w * h);
  });

  // MAZE はランダムな斜線パターンで約50%のピクセルが点灯する
  expect(coverage).toBeGreaterThan(0.2);
  expect(coverage).toBeLessThan(0.7);
});
