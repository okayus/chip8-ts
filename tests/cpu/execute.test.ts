import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execute } from "../../src/cpu/execute.ts";
import { createInitialCpuState, stackPush } from "../../src/cpu/state.ts";
import type { Instruction } from "../../src/domain/instruction.ts";
import { mkAddress, mkByte, mkNibble, mkRegisterIndex } from "../../src/domain/types.ts";
import { Memory } from "../../src/emulator/memory.ts";
import type { Audio, Display, Keyboard, Peripherals } from "../../src/peripherals/interfaces.ts";

// Mock peripherals
function createMockDisplay(): Display & { pixels: boolean[][] } {
  const pixels: boolean[][] = Array.from({ length: 32 }, () => Array(64).fill(false));
  return {
    pixels,
    clear() {
      for (const row of pixels) row.fill(false);
    },
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

function createMockKeyboard(
  pressedKeys: Set<number> = new Set(),
  pendingKey: number | null = null,
): Keyboard {
  return {
    isKeyPressed(key) {
      return pressedKeys.has(key);
    },
    getKeyPress() {
      return pendingKey !== null ? mkByte(pendingKey) : null;
    },
  };
}

function createMockAudio(): Audio {
  return { startBeep() {}, stopBeep() {} };
}

function createPeripherals(display?: Display, keyboard?: Keyboard, audio?: Audio): Peripherals {
  return {
    display: display ?? createMockDisplay(),
    keyboard: keyboard ?? createMockKeyboard(),
    audio: audio ?? createMockAudio(),
  };
}

function exec(instruction: Instruction, peripherals?: Peripherals) {
  const cpu = createInitialCpuState();
  const memory = new Memory();
  const p = peripherals ?? createPeripherals();
  execute(cpu, memory, instruction, p);
  return { cpu, memory };
}

// ---- Tests ----

describe("execute: NOP", () => {
  it("何も変更しない", () => {
    const { cpu } = exec({ tag: "NOP" });
    assert.equal(cpu.pc, 0x200);
  });
});

describe("execute: CLS", () => {
  it("ディスプレイをクリアする", () => {
    const display = createMockDisplay();
    display.pixels[0][0] = true;
    const p = createPeripherals(display);
    exec({ tag: "CLS" }, p);
    assert.equal(display.pixels[0][0], false);
  });
});

describe("execute: RET", () => {
  it("スタックから pop したアドレスに PC を設定する", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    stackPush(cpu, mkAddress(0x400));
    execute(cpu, memory, { tag: "RET" }, createPeripherals());
    assert.equal(cpu.pc, 0x400);
  });
});

describe("execute: JP addr", () => {
  it("PC = address", () => {
    const { cpu } = exec({ tag: "JP", address: mkAddress(0x300) });
    assert.equal(cpu.pc, 0x300);
  });
});

describe("execute: CALL addr", () => {
  it("現在の PC を push して address にジャンプ", () => {
    const { cpu } = exec({ tag: "CALL", address: mkAddress(0x400) });
    assert.equal(cpu.pc, 0x400);
    assert.equal(cpu.sp, 1);
  });
});

describe("execute: SE_BYTE (3XNN)", () => {
  it("Vx == NN なら PC += 2", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x42;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SE_BYTE", vx: mkRegisterIndex(0), byte: mkByte(0x42) },
      createPeripherals(),
    );
    assert.equal(cpu.pc, 0x202);
  });

  it("Vx != NN なら PC 変更なし", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x42;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SE_BYTE", vx: mkRegisterIndex(0), byte: mkByte(0x00) },
      createPeripherals(),
    );
    assert.equal(cpu.pc, 0x200);
  });
});

describe("execute: SNE_BYTE (4XNN)", () => {
  it("Vx != NN なら PC += 2", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x42;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SNE_BYTE", vx: mkRegisterIndex(0), byte: mkByte(0x00) },
      createPeripherals(),
    );
    assert.equal(cpu.pc, 0x202);
  });

  it("Vx == NN なら PC 変更なし", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x42;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SNE_BYTE", vx: mkRegisterIndex(0), byte: mkByte(0x42) },
      createPeripherals(),
    );
    assert.equal(cpu.pc, 0x200);
  });
});

describe("execute: SE_VY (5XY0)", () => {
  it("Vx == Vy なら PC += 2", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 5;
    cpu.v[1] = 5;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SE_VY", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.pc, 0x202);
  });
});

describe("execute: LD_BYTE (6XNN)", () => {
  it("Vx = NN", () => {
    const { cpu } = exec({ tag: "LD_BYTE", vx: mkRegisterIndex(5), byte: mkByte(0xab) });
    assert.equal(cpu.v[5], 0xab);
  });
});

describe("execute: ADD_BYTE (7XNN)", () => {
  it("Vx += NN (キャリーなし、ラップアラウンド)", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0xfe;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "ADD_BYTE", vx: mkRegisterIndex(0), byte: mkByte(0x03) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x01); // 0xFE + 0x03 = 0x101 → 0x01
  });
});

describe("execute: LD_VY (8XY0)", () => {
  it("Vx = Vy", () => {
    const cpu = createInitialCpuState();
    cpu.v[1] = 0x42;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "LD_VY", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x42);
  });
});

describe("execute: OR (8XY1)", () => {
  it("Vx |= Vy, VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x0f;
    cpu.v[1] = 0xf0;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "OR", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0xff);
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: AND (8XY2)", () => {
  it("Vx &= Vy, VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x0f;
    cpu.v[1] = 0xff;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "AND", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x0f);
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: XOR (8XY3)", () => {
  it("Vx ^= Vy, VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0xff;
    cpu.v[1] = 0x0f;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "XOR", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0xf0);
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: ADD_VY (8XY4)", () => {
  it("オーバーフローなし: VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 10;
    cpu.v[1] = 20;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "ADD_VY", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 30);
    assert.equal(cpu.v[0xf], 0);
  });

  it("オーバーフロー: VF = 1, 結果は下位 8bit", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0xff;
    cpu.v[1] = 0x02;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "ADD_VY", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x01);
    assert.equal(cpu.v[0xf], 1);
  });
});

describe("execute: SUB (8XY5)", () => {
  it("Vx >= Vy: VF = 1 (NOT borrow)", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 10;
    cpu.v[1] = 5;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SUB", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 5);
    assert.equal(cpu.v[0xf], 1);
  });

  it("Vx < Vy: VF = 0 (borrow), 結果はラップアラウンド", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 5;
    cpu.v[1] = 10;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SUB", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 251); // (5 - 10) & 0xFF = 251
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: SHR (8XY6)", () => {
  it("LSB = 1: VF = 1", () => {
    const cpu = createInitialCpuState();
    cpu.v[1] = 0x03; // binary: 11, LSB = 1
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SHR", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x01);
    assert.equal(cpu.v[0xf], 1);
  });

  it("LSB = 0: VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[1] = 0x04; // binary: 100, LSB = 0
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SHR", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x02);
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: SUBN (8XY7)", () => {
  it("Vy >= Vx: VF = 1", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 5;
    cpu.v[1] = 10;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SUBN", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 5);
    assert.equal(cpu.v[0xf], 1);
  });

  it("Vy < Vx: VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 10;
    cpu.v[1] = 5;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SUBN", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 251);
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: SHL (8XYE)", () => {
  it("MSB = 1: VF = 1", () => {
    const cpu = createInitialCpuState();
    cpu.v[1] = 0x80; // MSB = 1
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SHL", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x00);
    assert.equal(cpu.v[0xf], 1);
  });

  it("MSB = 0: VF = 0", () => {
    const cpu = createInitialCpuState();
    cpu.v[1] = 0x40; // MSB = 0
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SHL", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.v[0], 0x80);
    assert.equal(cpu.v[0xf], 0);
  });
});

describe("execute: SNE_VY (9XY0)", () => {
  it("Vx != Vy なら PC += 2", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 1;
    cpu.v[1] = 2;
    const memory = new Memory();
    execute(
      cpu,
      memory,
      { tag: "SNE_VY", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1) },
      createPeripherals(),
    );
    assert.equal(cpu.pc, 0x202);
  });
});

describe("execute: LD_I (ANNN)", () => {
  it("I = NNN", () => {
    const { cpu } = exec({ tag: "LD_I", address: mkAddress(0x300) });
    assert.equal(cpu.i, 0x300);
  });
});

describe("execute: JP_V0 (BNNN)", () => {
  it("PC = V0 + NNN", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x10;
    const memory = new Memory();
    execute(cpu, memory, { tag: "JP_V0", address: mkAddress(0x200) }, createPeripherals());
    assert.equal(cpu.pc, 0x210);
  });
});

describe("execute: RND (CXNN)", () => {
  it("結果が byte の AND マスク内に収まる", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    // Run multiple times to verify masking
    for (let i = 0; i < 100; i++) {
      cpu.v[0] = 0xff;
      execute(
        cpu,
        memory,
        { tag: "RND", vx: mkRegisterIndex(0), byte: mkByte(0x0f) },
        createPeripherals(),
      );
      assert.ok(cpu.v[0] <= 0x0f, `Random value ${cpu.v[0]} exceeds mask 0x0F`);
    }
  });
});

describe("execute: DRW (DXYN)", () => {
  it("スプライトを描画する", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    const display = createMockDisplay();
    const p = createPeripherals(display);

    cpu.v[0] = 0; // x
    cpu.v[1] = 0; // y
    cpu.i = mkAddress(0x300);
    memory.writeByte(mkAddress(0x300), mkByte(0x80)); // 10000000

    execute(
      cpu,
      memory,
      { tag: "DRW", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1), nibble: mkNibble(1) },
      p,
    );

    assert.equal(display.pixels[0][0], true);
    assert.equal(display.pixels[0][1], false);
    assert.equal(cpu.v[0xf], 0); // no collision
  });

  it("XOR 描画で衝突検出 (VF = 1)", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    const display = createMockDisplay();
    display.pixels[0][0] = true; // already on
    const p = createPeripherals(display);

    cpu.v[0] = 0;
    cpu.v[1] = 0;
    cpu.i = mkAddress(0x300);
    memory.writeByte(mkAddress(0x300), mkByte(0x80));

    execute(
      cpu,
      memory,
      { tag: "DRW", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1), nibble: mkNibble(1) },
      p,
    );

    assert.equal(display.pixels[0][0], false); // XOR turned it off
    assert.equal(cpu.v[0xf], 1); // collision
  });

  it("画面端でクリッピングされる", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    const display = createMockDisplay();
    const p = createPeripherals(display);

    cpu.v[0] = 63; // x = right edge
    cpu.v[1] = 0;
    cpu.i = mkAddress(0x300);
    memory.writeByte(mkAddress(0x300), mkByte(0xff)); // 8 pixels wide

    execute(
      cpu,
      memory,
      { tag: "DRW", vx: mkRegisterIndex(0), vy: mkRegisterIndex(1), nibble: mkNibble(1) },
      p,
    );

    assert.equal(display.pixels[0][63], true); // only first pixel drawn
  });
});

describe("execute: SKP (EX9E)", () => {
  it("キー押下中なら PC += 2", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 5;
    const memory = new Memory();
    const keyboard = createMockKeyboard(new Set([5]));
    execute(
      cpu,
      memory,
      { tag: "SKP", vx: mkRegisterIndex(0) },
      createPeripherals(undefined, keyboard),
    );
    assert.equal(cpu.pc, 0x202);
  });

  it("キー非押下なら PC 変更なし", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 5;
    const memory = new Memory();
    execute(cpu, memory, { tag: "SKP", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.pc, 0x200);
  });
});

describe("execute: SKNP (EXA1)", () => {
  it("キー非押下なら PC += 2", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 5;
    const memory = new Memory();
    execute(cpu, memory, { tag: "SKNP", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.pc, 0x202);
  });
});

describe("execute: LD_VX_DT (FX07)", () => {
  it("Vx = DT", () => {
    const cpu = createInitialCpuState();
    cpu.dt = mkByte(30);
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_VX_DT", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.v[0], 30);
  });
});

describe("execute: LD_VX_K (FX0A)", () => {
  it("キーが押されていなければ PC を巻き戻す (ブロッキング)", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_VX_K", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.pc, 0x1fe); // 0x200 - 2
  });

  it("キーが押されていれば Vx にセットする", () => {
    const cpu = createInitialCpuState();
    const memory = new Memory();
    const keyboard = createMockKeyboard(new Set(), 0xa);
    execute(
      cpu,
      memory,
      { tag: "LD_VX_K", vx: mkRegisterIndex(0) },
      createPeripherals(undefined, keyboard),
    );
    assert.equal(cpu.v[0], 0xa);
    assert.equal(cpu.pc, 0x200);
  });
});

describe("execute: LD_DT_VX (FX15)", () => {
  it("DT = Vx", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 60;
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_DT_VX", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.dt, 60);
  });
});

describe("execute: LD_ST_VX (FX18)", () => {
  it("ST = Vx", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 30;
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_ST_VX", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.st, 30);
  });
});

describe("execute: ADD_I_VX (FX1E)", () => {
  it("I += Vx", () => {
    const cpu = createInitialCpuState();
    cpu.i = mkAddress(0x100);
    cpu.v[0] = 0x10;
    const memory = new Memory();
    execute(cpu, memory, { tag: "ADD_I_VX", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.i, 0x110);
  });
});

describe("execute: LD_F_VX (FX29)", () => {
  it("I = Vx * 5 (フォントアドレス)", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0xa; // character 'A'
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_F_VX", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(cpu.i, 0xa * 5);
  });
});

describe("execute: LD_B_VX (FX33)", () => {
  it("BCD 変換: 254 → [2, 5, 4]", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 254;
    cpu.i = mkAddress(0x300);
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_B_VX", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(memory.readByte(mkAddress(0x300)), 2);
    assert.equal(memory.readByte(mkAddress(0x301)), 5);
    assert.equal(memory.readByte(mkAddress(0x302)), 4);
  });

  it("BCD 変換: 0 → [0, 0, 0]", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0;
    cpu.i = mkAddress(0x300);
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_B_VX", vx: mkRegisterIndex(0) }, createPeripherals());
    assert.equal(memory.readByte(mkAddress(0x300)), 0);
    assert.equal(memory.readByte(mkAddress(0x301)), 0);
    assert.equal(memory.readByte(mkAddress(0x302)), 0);
  });
});

describe("execute: LD_I_VX (FX55)", () => {
  it("V0–Vx を RAM[I..] に保存し、I を更新", () => {
    const cpu = createInitialCpuState();
    cpu.v[0] = 0x10;
    cpu.v[1] = 0x20;
    cpu.v[2] = 0x30;
    cpu.i = mkAddress(0x300);
    const memory = new Memory();
    execute(cpu, memory, { tag: "LD_I_VX", vx: mkRegisterIndex(2) }, createPeripherals());
    assert.equal(memory.readByte(mkAddress(0x300)), 0x10);
    assert.equal(memory.readByte(mkAddress(0x301)), 0x20);
    assert.equal(memory.readByte(mkAddress(0x302)), 0x30);
    assert.equal(cpu.i, 0x303); // I += x + 1
  });
});

describe("execute: LD_VX_I (FX65)", () => {
  it("RAM[I..] から V0–Vx に読み込み、I を更新", () => {
    const cpu = createInitialCpuState();
    cpu.i = mkAddress(0x300);
    const memory = new Memory();
    memory.writeByte(mkAddress(0x300), mkByte(0xaa));
    memory.writeByte(mkAddress(0x301), mkByte(0xbb));
    execute(cpu, memory, { tag: "LD_VX_I", vx: mkRegisterIndex(1) }, createPeripherals());
    assert.equal(cpu.v[0], 0xaa);
    assert.equal(cpu.v[1], 0xbb);
    assert.equal(cpu.i, 0x302); // I += x + 1
  });
});
