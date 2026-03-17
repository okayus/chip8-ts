import type { Byte } from "../domain/types.ts";
import { mkByte } from "../domain/types.ts";
import type { Keyboard } from "../peripherals/interfaces.ts";

/**
 * QWERTY → CHIP-8 key mapping:
 * 1 2 3 4  →  1 2 3 C
 * Q W E R  →  4 5 6 D
 * A S D F  →  7 8 9 E
 * Z X C V  →  A 0 B F
 */
const KEY_MAP: Record<string, number> = {
  "1": 0x1,
  "2": 0x2,
  "3": 0x3,
  "4": 0xc,
  q: 0x4,
  w: 0x5,
  e: 0x6,
  r: 0xd,
  a: 0x7,
  s: 0x8,
  d: 0x9,
  f: 0xe,
  z: 0xa,
  x: 0x0,
  c: 0xb,
  v: 0xf,
};

export class KeyboardInput implements Keyboard {
  private readonly pressed = new Set<number>();
  private readonly justPressed = new Set<number>();
  private lastKeyPressed: number | null = null;

  constructor() {
    document.addEventListener("keydown", (e) => {
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key !== undefined) {
        if (!this.pressed.has(key)) {
          this.justPressed.add(key);
        }
        this.pressed.add(key);
        this.lastKeyPressed = key;
      }
    });

    document.addEventListener("keyup", (e) => {
      const key = KEY_MAP[e.key.toLowerCase()];
      if (key !== undefined) {
        this.pressed.delete(key);
      }
    });
  }

  isKeyPressed(key: Byte): boolean {
    return this.pressed.has(key);
  }

  isKeyJustPressed(key: Byte): boolean {
    return this.justPressed.delete(key);
  }

  getKeyPress(): Byte | null {
    if (this.lastKeyPressed !== null) {
      const key = this.lastKeyPressed;
      this.lastKeyPressed = null;
      return mkByte(key);
    }
    return null;
  }
}
