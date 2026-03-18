import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decode } from "../../src/cpu/decode.ts";
import { mkWord } from "../../src/domain/types.ts";

describe("decode: 0x0NNN 系", () => {
  it("0x0000 → NOP", () => {
    assert.deepEqual(decode(mkWord(0x0000)), { tag: "NOP" });
  });

  it("0x00E0 → CLS", () => {
    assert.deepEqual(decode(mkWord(0x00e0)), { tag: "CLS" });
  });

  it("0x00F0 → BEGIN_DRAW_BATCH", () => {
    assert.deepEqual(decode(mkWord(0x00f0)), { tag: "BEGIN_DRAW_BATCH" });
  });

  it("0x00F1 → END_DRAW_BATCH", () => {
    assert.deepEqual(decode(mkWord(0x00f1)), { tag: "END_DRAW_BATCH" });
  });

  it("0x00EE → RET", () => {
    assert.deepEqual(decode(mkWord(0x00ee)), { tag: "RET" });
  });

  it("不明な 0x0NNN はエラー", () => {
    assert.throws(() => decode(mkWord(0x0123)), Error);
  });
});

describe("decode: 0x1NNN — JP addr", () => {
  it("0x1234 → JP 0x234", () => {
    assert.deepEqual(decode(mkWord(0x1234)), { tag: "JP", address: 0x234 });
  });

  it("0x1FFF → JP 0xFFF", () => {
    assert.deepEqual(decode(mkWord(0x1fff)), { tag: "JP", address: 0xfff });
  });
});

describe("decode: 0x2NNN — CALL addr", () => {
  it("0x2456 → CALL 0x456", () => {
    assert.deepEqual(decode(mkWord(0x2456)), { tag: "CALL", address: 0x456 });
  });
});

describe("decode: 0x3XNN — SE Vx, byte", () => {
  it("0x3A12 → SE V10, 0x12", () => {
    assert.deepEqual(decode(mkWord(0x3a12)), { tag: "SE_BYTE", vx: 0xa, byte: 0x12 });
  });
});

describe("decode: 0x4XNN — SNE Vx, byte", () => {
  it("0x4B34 → SNE V11, 0x34", () => {
    assert.deepEqual(decode(mkWord(0x4b34)), { tag: "SNE_BYTE", vx: 0xb, byte: 0x34 });
  });
});

describe("decode: 0x5XY0 — SE Vx, Vy", () => {
  it("0x5120 → SE V1, V2", () => {
    assert.deepEqual(decode(mkWord(0x5120)), { tag: "SE_VY", vx: 0x1, vy: 0x2 });
  });
});

describe("decode: 0x6XNN — LD Vx, byte", () => {
  it("0x60FF → LD V0, 0xFF", () => {
    assert.deepEqual(decode(mkWord(0x60ff)), { tag: "LD_BYTE", vx: 0x0, byte: 0xff });
  });
});

describe("decode: 0x7XNN — ADD Vx, byte", () => {
  it("0x7501 → ADD V5, 0x01", () => {
    assert.deepEqual(decode(mkWord(0x7501)), { tag: "ADD_BYTE", vx: 0x5, byte: 0x01 });
  });
});

describe("decode: 0x8XYN 系 (ALU 命令)", () => {
  it("0x8120 → LD V1, V2", () => {
    assert.deepEqual(decode(mkWord(0x8120)), { tag: "LD_VY", vx: 0x1, vy: 0x2 });
  });

  it("0x8AB1 → OR VA, VB", () => {
    assert.deepEqual(decode(mkWord(0x8ab1)), { tag: "OR", vx: 0xa, vy: 0xb });
  });

  it("0x8CD2 → AND VC, VD", () => {
    assert.deepEqual(decode(mkWord(0x8cd2)), { tag: "AND", vx: 0xc, vy: 0xd });
  });

  it("0x8013 → XOR V0, V1", () => {
    assert.deepEqual(decode(mkWord(0x8013)), { tag: "XOR", vx: 0x0, vy: 0x1 });
  });

  it("0x8234 → ADD V2, V3", () => {
    assert.deepEqual(decode(mkWord(0x8234)), { tag: "ADD_VY", vx: 0x2, vy: 0x3 });
  });

  it("0x8455 → SUB V4, V5", () => {
    assert.deepEqual(decode(mkWord(0x8455)), { tag: "SUB", vx: 0x4, vy: 0x5 });
  });

  it("0x8016 → SHR V0, V1", () => {
    assert.deepEqual(decode(mkWord(0x8016)), { tag: "SHR", vx: 0x0, vy: 0x1 });
  });

  it("0x8677 → SUBN V6, V7", () => {
    assert.deepEqual(decode(mkWord(0x8677)), { tag: "SUBN", vx: 0x6, vy: 0x7 });
  });

  it("0x801E → SHL V0, V1", () => {
    assert.deepEqual(decode(mkWord(0x801e)), { tag: "SHL", vx: 0x0, vy: 0x1 });
  });

  it("不明な 0x8XYN はエラー (N=8)", () => {
    assert.throws(() => decode(mkWord(0x8008)), Error);
  });
});

describe("decode: 0x9XY0 — SNE Vx, Vy", () => {
  it("0x9340 → SNE V3, V4", () => {
    assert.deepEqual(decode(mkWord(0x9340)), { tag: "SNE_VY", vx: 0x3, vy: 0x4 });
  });
});

describe("decode: 0xANNN — LD I, addr", () => {
  it("0xA123 → LD I, 0x123", () => {
    assert.deepEqual(decode(mkWord(0xa123)), { tag: "LD_I", address: 0x123 });
  });
});

describe("decode: 0xBNNN — JP V0, addr", () => {
  it("0xB456 → JP V0, 0x456", () => {
    assert.deepEqual(decode(mkWord(0xb456)), { tag: "JP_V0", address: 0x456 });
  });
});

describe("decode: 0xCXNN — RND Vx, byte", () => {
  it("0xC2AB → RND V2, 0xAB", () => {
    assert.deepEqual(decode(mkWord(0xc2ab)), { tag: "RND", vx: 0x2, byte: 0xab });
  });
});

describe("decode: 0xDXYN — DRW Vx, Vy, nibble", () => {
  it("0xD125 → DRW V1, V2, 5", () => {
    assert.deepEqual(decode(mkWord(0xd125)), { tag: "DRW", vx: 0x1, vy: 0x2, nibble: 0x5 });
  });
});

describe("decode: 0xEXNN 系 (キー入力)", () => {
  it("0xE19E → SKP V1", () => {
    assert.deepEqual(decode(mkWord(0xe19e)), { tag: "SKP", vx: 0x1 });
  });

  it("0xE19F → JKP V1", () => {
    assert.deepEqual(decode(mkWord(0xe19f)), { tag: "JKP", vx: 0x1 });
  });

  it("0xE2A1 → SKNP V2", () => {
    assert.deepEqual(decode(mkWord(0xe2a1)), { tag: "SKNP", vx: 0x2 });
  });

  it("不明な 0xEXNN はエラー", () => {
    assert.throws(() => decode(mkWord(0xe100)), Error);
  });
});

describe("decode: 0xFXNN 系 (特殊命令)", () => {
  it("0xF107 → LD V1, DT", () => {
    assert.deepEqual(decode(mkWord(0xf107)), { tag: "LD_VX_DT", vx: 0x1 });
  });

  it("0xF20A → LD V2, K", () => {
    assert.deepEqual(decode(mkWord(0xf20a)), { tag: "LD_VX_K", vx: 0x2 });
  });

  it("0xF315 → LD DT, V3", () => {
    assert.deepEqual(decode(mkWord(0xf315)), { tag: "LD_DT_VX", vx: 0x3 });
  });

  it("0xF418 → LD ST, V4", () => {
    assert.deepEqual(decode(mkWord(0xf418)), { tag: "LD_ST_VX", vx: 0x4 });
  });

  it("0xF51E → ADD I, V5", () => {
    assert.deepEqual(decode(mkWord(0xf51e)), { tag: "ADD_I_VX", vx: 0x5 });
  });

  it("0xF629 → LD F, V6", () => {
    assert.deepEqual(decode(mkWord(0xf629)), { tag: "LD_F_VX", vx: 0x6 });
  });

  it("0xF733 → LD B, V7", () => {
    assert.deepEqual(decode(mkWord(0xf733)), { tag: "LD_B_VX", vx: 0x7 });
  });

  it("0xF855 → LD [I], V8", () => {
    assert.deepEqual(decode(mkWord(0xf855)), { tag: "LD_I_VX", vx: 0x8 });
  });

  it("0xF965 → LD V9, [I]", () => {
    assert.deepEqual(decode(mkWord(0xf965)), { tag: "LD_VX_I", vx: 0x9 });
  });

  it("不明な 0xFXNN はエラー", () => {
    assert.throws(() => decode(mkWord(0xf0ff)), Error);
  });
});
