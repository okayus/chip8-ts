import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Emulator } from "../../src/emulator/emulator.ts";
import type { Display, Peripherals } from "../../src/peripherals/interfaces.ts";

function createMockDisplay(): Display & { pixels: boolean[][] } {
  const pixels: boolean[][] = Array.from({ length: 32 }, () => Array(64).fill(false));
  return {
    pixels,
    clear() {
      for (const row of pixels) row.fill(false);
    },
    beginDrawBatch() {},
    endDrawBatch() {},
    getPixel(x: number, y: number) {
      return pixels[y][x];
    },
    xorPixel(x: number, y: number) {
      const wasOn = pixels[y][x];
      pixels[y][x] = !wasOn;
      return wasOn;
    },
  };
}

function createMockPeripherals(): Peripherals & { display: ReturnType<typeof createMockDisplay> } {
  const display = createMockDisplay();
  return {
    display,
    keyboard: {
      isKeyPressed() {
        return false;
      },
      isKeyJustPressed() {
        return false;
      },
      getKeyPress() {
        return null;
      },
    },
    audio: { startBeep() {}, stopBeep() {} },
  };
}

describe("Emulator", () => {
  it("ROM をロードして命令を実行できる", () => {
    const p = createMockPeripherals();
    const emu = new Emulator(p);
    // 0x6005: LD V0, 0x05
    // 0x6105: LD V1, 0x05
    emu.load(new Uint8Array([0x60, 0x05, 0x61, 0x0a]));
    emu.tick(); // LD V0, 5
    assert.equal(emu.getCpuState().v[0], 5);
    emu.tick(); // LD V1, 10
    assert.equal(emu.getCpuState().v[1], 10);
  });

  it("CLS 命令でディスプレイをクリアできる", () => {
    const p = createMockPeripherals();
    p.display.pixels[0][0] = true;
    const emu = new Emulator(p);
    // 0x00E0: CLS
    emu.load(new Uint8Array([0x00, 0xe0]));
    emu.tick();
    assert.equal(p.display.pixels[0][0], false);
  });

  it("サブルーチン呼び出しと復帰", () => {
    const p = createMockPeripherals();
    const emu = new Emulator(p);
    // 0x200: CALL 0x204
    // 0x202: LD V1, 0xFF (return here)
    // 0x204: LD V0, 0x42
    // 0x206: RET
    emu.load(new Uint8Array([0x22, 0x04, 0x61, 0xff, 0x60, 0x42, 0x00, 0xee]));
    emu.tick(); // CALL 0x204
    assert.equal(emu.getCpuState().pc, 0x204);
    emu.tick(); // LD V0, 0x42
    assert.equal(emu.getCpuState().v[0], 0x42);
    emu.tick(); // RET → PC = 0x202
    assert.equal(emu.getCpuState().pc, 0x202);
    emu.tick(); // LD V1, 0xFF
    assert.equal(emu.getCpuState().v[1], 0xff);
  });

  it("条件分岐 (SE + JP) による簡単なプログラム", () => {
    const p = createMockPeripherals();
    const emu = new Emulator(p);
    // 0x200: LD V0, 5     (0x6005)
    // 0x202: SE V0, 5     (0x3005) → skip next
    // 0x204: LD V1, 0xFF  (0x61FF) ← skipped
    // 0x206: LD V1, 0x42  (0x6142)
    emu.load(new Uint8Array([0x60, 0x05, 0x30, 0x05, 0x61, 0xff, 0x61, 0x42]));
    emu.tick(); // LD V0, 5
    emu.tick(); // SE V0, 5 → skip
    emu.tick(); // LD V1, 0x42 (skipped 0x61FF)
    assert.equal(emu.getCpuState().v[1], 0x42);
  });

  describe("tickTimers", () => {
    it("DT > 0 なら DT を 1 減算する", () => {
      const p = createMockPeripherals();
      const emu = new Emulator(p);
      // LD V0, 10 → LD DT, V0
      emu.load(new Uint8Array([0x60, 0x0a, 0xf0, 0x15]));
      emu.tick(); // LD V0, 10
      emu.tick(); // LD DT, V0
      assert.equal(emu.getCpuState().dt, 10);
      emu.tickTimers();
      assert.equal(emu.getCpuState().dt, 9);
    });

    it("DT == 0 なら減算しない", () => {
      const p = createMockPeripherals();
      const emu = new Emulator(p);
      emu.load(new Uint8Array([0x00, 0x00])); // NOP
      emu.tickTimers();
      assert.equal(emu.getCpuState().dt, 0);
    });

    it("ST > 0 なら ST を 1 減算する", () => {
      const p = createMockPeripherals();
      const emu = new Emulator(p);
      // LD V0, 2 → LD ST, V0
      emu.load(new Uint8Array([0x60, 0x02, 0xf0, 0x18]));
      emu.tick();
      emu.tick();
      assert.equal(emu.getCpuState().st, 2);
      emu.tickTimers();
      assert.equal(emu.getCpuState().st, 1);
    });
  });

  it("reset で初期状態に戻る", () => {
    const p = createMockPeripherals();
    const emu = new Emulator(p);
    emu.load(new Uint8Array([0x60, 0x42]));
    emu.tick();
    assert.equal(emu.getCpuState().v[0], 0x42);
    emu.reset();
    assert.equal(emu.getCpuState().v[0], 0);
    assert.equal(emu.getCpuState().pc, 0x200);
  });
});
