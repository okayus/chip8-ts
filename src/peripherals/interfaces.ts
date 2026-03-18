import type { Byte } from "../domain/types.ts";

/** 64×32 monochrome display */
export interface Display {
  /** Clear all pixels */
  clear(): void;
  /** Begin an atomic draw batch. Intermediate states stay hidden until committed. */
  beginDrawBatch(): void;
  /** Commit the current atomic draw batch. */
  endDrawBatch(): void;
  /** Get pixel at (x, y). Returns true if pixel is on. */
  getPixel(x: number, y: number): boolean;
  /** Set pixel at (x, y) via XOR. Returns true if pixel was turned off (collision). */
  xorPixel(x: number, y: number): boolean;
}

/** 16-key hex keypad (0x0–0xF) */
export interface Keyboard {
  /** Returns true if the key is currently pressed */
  isKeyPressed(key: Byte): boolean;
  /** Returns true once when the key transitions from up to down */
  isKeyJustPressed(key: Byte): boolean;
  /** Returns the key that was pressed (blocking in real impl, returns null if none) */
  getKeyPress(): Byte | null;
}

/** Audio output (single-tone beeper) */
export interface Audio {
  /** Start playing the beep tone */
  startBeep(): void;
  /** Stop playing the beep tone */
  stopBeep(): void;
}

/** Bundle of all peripherals */
export interface Peripherals {
  readonly display: Display;
  readonly keyboard: Keyboard;
  readonly audio: Audio;
}

export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;
