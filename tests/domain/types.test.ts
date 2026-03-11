import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkAddress, mkByte, mkNibble, mkRegisterIndex, mkWord } from "../../src/domain/types.ts";

describe("mkAddress", () => {
  it("最小値 0x000 を受け入れる", () => {
    assert.equal(mkAddress(0x000), 0x000);
  });

  it("最大値 0xFFF を受け入れる", () => {
    assert.equal(mkAddress(0xfff), 0xfff);
  });

  it("中間値 0x200 (ROM開始アドレス) を受け入れる", () => {
    assert.equal(mkAddress(0x200), 0x200);
  });

  it("負の値を拒否する", () => {
    assert.throws(() => mkAddress(-1), RangeError);
  });

  it("0xFFF を超える値を拒否する", () => {
    assert.throws(() => mkAddress(0x1000), RangeError);
  });

  it("小数を拒否する", () => {
    assert.throws(() => mkAddress(1.5), RangeError);
  });
});

describe("mkByte", () => {
  it("最小値 0x00 を受け入れる", () => {
    assert.equal(mkByte(0x00), 0x00);
  });

  it("最大値 0xFF を受け入れる", () => {
    assert.equal(mkByte(0xff), 0xff);
  });

  it("負の値を拒否する", () => {
    assert.throws(() => mkByte(-1), RangeError);
  });

  it("0xFF を超える値を拒否する", () => {
    assert.throws(() => mkByte(0x100), RangeError);
  });

  it("小数を拒否する", () => {
    assert.throws(() => mkByte(0.5), RangeError);
  });
});

describe("mkWord", () => {
  it("最小値 0x0000 を受け入れる", () => {
    assert.equal(mkWord(0x0000), 0x0000);
  });

  it("最大値 0xFFFF を受け入れる", () => {
    assert.equal(mkWord(0xffff), 0xffff);
  });

  it("負の値を拒否する", () => {
    assert.throws(() => mkWord(-1), RangeError);
  });

  it("0xFFFF を超える値を拒否する", () => {
    assert.throws(() => mkWord(0x10000), RangeError);
  });

  it("小数を拒否する", () => {
    assert.throws(() => mkWord(1.5), RangeError);
  });
});

describe("mkNibble", () => {
  it("最小値 0x0 を受け入れる", () => {
    assert.equal(mkNibble(0x0), 0x0);
  });

  it("最大値 0xF を受け入れる", () => {
    assert.equal(mkNibble(0xf), 0xf);
  });

  it("負の値を拒否する", () => {
    assert.throws(() => mkNibble(-1), RangeError);
  });

  it("0xF を超える値を拒否する", () => {
    assert.throws(() => mkNibble(0x10), RangeError);
  });

  it("小数を拒否する", () => {
    assert.throws(() => mkNibble(0.5), RangeError);
  });
});

describe("mkRegisterIndex", () => {
  it("最小値 0 (V0) を受け入れる", () => {
    assert.equal(mkRegisterIndex(0), 0);
  });

  it("最大値 15 (VF) を受け入れる", () => {
    assert.equal(mkRegisterIndex(15), 15);
  });

  it("中間値 8 を受け入れる", () => {
    assert.equal(mkRegisterIndex(8), 8);
  });

  it("負の値を拒否する", () => {
    assert.throws(() => mkRegisterIndex(-1), RangeError);
  });

  it("15 を超える値を拒否する", () => {
    assert.throws(() => mkRegisterIndex(16), RangeError);
  });

  it("小数を拒否する", () => {
    assert.throws(() => mkRegisterIndex(1.5), RangeError);
  });
});
