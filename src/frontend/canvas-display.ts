import type { Display } from "../peripherals/interfaces.ts";
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from "../peripherals/interfaces.ts";

const SCALE = 10;
const COLOR_ON = "#33ff33";
const COLOR_OFF = "#000000";

export class CanvasDisplay implements Display {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pixels: boolean[][];

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = DISPLAY_WIDTH * SCALE;
    canvas.height = DISPLAY_HEIGHT * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;
    this.pixels = Array.from({ length: DISPLAY_HEIGHT }, () =>
      Array<boolean>(DISPLAY_WIDTH).fill(false),
    );
    this.render();
  }

  clear(): void {
    for (const row of this.pixels) row.fill(false);
  }

  getPixel(x: number, y: number): boolean {
    return this.pixels[y][x];
  }

  xorPixel(x: number, y: number): boolean {
    const wasOn = this.pixels[y][x];
    this.pixels[y][x] = !wasOn;
    return wasOn;
  }

  /** Render the pixel buffer to the canvas */
  render(): void {
    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
      for (let x = 0; x < DISPLAY_WIDTH; x++) {
        this.ctx.fillStyle = this.pixels[y][x] ? COLOR_ON : COLOR_OFF;
        this.ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    }
  }
}
