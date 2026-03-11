import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FONT_BYTES_PER_CHAR, FONT_DATA } from "../../src/domain/font.ts";

describe("FONT_DATA", () => {
  it("80 バイト (16文字 × 5バイト) である", () => {
    assert.equal(FONT_DATA.length, 80);
  });

  it("全値が 0x00–0xFF の範囲内である", () => {
    for (const byte of FONT_DATA) {
      assert.ok(byte >= 0x00 && byte <= 0xff, `Invalid font byte: ${byte}`);
    }
  });

  it("文字 '0' のスプライトデータが正しい", () => {
    const start = 0 * FONT_BYTES_PER_CHAR;
    const sprite = FONT_DATA.slice(start, start + FONT_BYTES_PER_CHAR);
    assert.deepEqual(sprite, [0xf0, 0x90, 0x90, 0x90, 0xf0]);
  });

  it("文字 '1' のスプライトデータが正しい", () => {
    const start = 1 * FONT_BYTES_PER_CHAR;
    const sprite = FONT_DATA.slice(start, start + FONT_BYTES_PER_CHAR);
    assert.deepEqual(sprite, [0x20, 0x60, 0x20, 0x20, 0x70]);
  });

  it("文字 'F' のスプライトデータが正しい", () => {
    const start = 15 * FONT_BYTES_PER_CHAR;
    const sprite = FONT_DATA.slice(start, start + FONT_BYTES_PER_CHAR);
    assert.deepEqual(sprite, [0xf0, 0x80, 0xf0, 0x80, 0x80]);
  });
});

describe("FONT_BYTES_PER_CHAR", () => {
  it("1文字あたり 5 バイトである", () => {
    assert.equal(FONT_BYTES_PER_CHAR, 5);
  });
});
