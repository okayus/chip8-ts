import type { Display } from "../peripherals/interfaces.ts";
import { DISPLAY_HEIGHT, DISPLAY_WIDTH } from "../peripherals/interfaces.ts";

const SCALE = 10;
const COLOR_ON = "#33ff33";
const COLOR_OFF = "#000000";

export class CanvasDisplay implements Display {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pixels: boolean[][];
  private readonly committedPixels: boolean[][];
  private batchDepth = 0;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = DISPLAY_WIDTH * SCALE;
    canvas.height = DISPLAY_HEIGHT * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;
    this.pixels = Array.from({ length: DISPLAY_HEIGHT }, () =>
      Array<boolean>(DISPLAY_WIDTH).fill(false),
    );
    this.committedPixels = Array.from({ length: DISPLAY_HEIGHT }, () =>
      Array<boolean>(DISPLAY_WIDTH).fill(false),
    );
    this.render();
  }

  clear(): void {
    for (const row of this.pixels) row.fill(false);
    if (this.batchDepth === 0) {
      for (const row of this.committedPixels) row.fill(false);
    }
  }

  beginDrawBatch(): void {
    if (this.batchDepth === 0) {
      for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
          this.pixels[y][x] = this.committedPixels[y][x];
        }
      }
    }
    this.batchDepth += 1;
  }

  endDrawBatch(): void {
    if (this.batchDepth === 0) return;
    this.batchDepth -= 1;
    if (this.batchDepth === 0) {
      for (let y = 0; y < DISPLAY_HEIGHT; y++) {
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
          this.committedPixels[y][x] = this.pixels[y][x];
        }
      }
    }
  }

  getPixel(x: number, y: number): boolean {
    return this.pixels[y][x];
  }

  xorPixel(x: number, y: number): boolean {
    const wasOn = this.pixels[y][x];
    this.pixels[y][x] = !wasOn;
    if (this.batchDepth === 0) {
      this.committedPixels[y][x] = this.pixels[y][x];
    }
    return wasOn;
  }

  /** Render the pixel buffer to the canvas */
  render(): void {
    const source = this.batchDepth > 0 ? this.committedPixels : this.pixels;
    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
      for (let x = 0; x < DISPLAY_WIDTH; x++) {
        this.ctx.fillStyle = source[y][x] ? COLOR_ON : COLOR_OFF;
        this.ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    }
  }
}
