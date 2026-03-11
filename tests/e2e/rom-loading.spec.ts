import { expect, test } from "@playwright/test";

test("サンプル ROM を選択するとステータスが更新されピクセルが描画される", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#rom-select", "roms/PONG.ch8");

  await expect(page.locator("#status")).toContainText("Loaded: PONG.ch8");

  // エミュレーションが数フレーム進むのを待つ
  await page.waitForTimeout(500);

  const hasPixels = await page.evaluate(() => {
    const canvas = document.getElementById("display") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) return true;
    }
    return false;
  });
  expect(hasPixels).toBe(true);
});

test("Reset で画面がクリアされステータスが更新される", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#rom-select", "roms/PONG.ch8");
  await expect(page.locator("#status")).toContainText("Loaded");
  await page.waitForTimeout(300);

  await page.click("#reset-btn");
  await expect(page.locator("#status")).toHaveText("Reset");

  const allBlack = await page.evaluate(() => {
    const canvas = document.getElementById("display") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) return false;
    }
    return true;
  });
  expect(allBlack).toBe(true);
});
