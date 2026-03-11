import { expect, test } from "@playwright/test";

test("キーボード入力がエミュレータに反映される", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#rom-select", "roms/PONG.ch8");
  await page.waitForTimeout(500);

  // キー押下前の画面状態を取得
  const before = await page.evaluate(() => {
    const canvas = document.getElementById("display") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  });

  // '1' キー (CHIP-8 の 0x1 に対応) を押し続ける
  await page.keyboard.down("1");
  await page.waitForTimeout(500);
  await page.keyboard.up("1");
  await page.waitForTimeout(200);

  // キー押下後の画面状態を取得
  const after = await page.evaluate(() => {
    const canvas = document.getElementById("display") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  });

  // 画面が変化していること（ゲームが進行した）
  const changed = before.some((v, i) => v !== after[i]);
  expect(changed).toBe(true);
});
