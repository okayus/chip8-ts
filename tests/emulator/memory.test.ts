import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FONT_DATA } from "../../src/domain/font.ts";
import { mkAddress, mkByte } from "../../src/domain/types.ts";
import { Memory } from "../../src/emulator/memory.ts";

describe("Memory", () => {
  describe("初期化", () => {
    it("フォントデータが 0x000–0x04F に配置されている", () => {
      const mem = new Memory();
      for (let i = 0; i < FONT_DATA.length; i++) {
        assert.equal(mem.readByte(mkAddress(i)), FONT_DATA[i]);
      }
    });
  });

  describe("readByte / writeByte", () => {
    it("書き込んだバイトを読み出せる", () => {
      const mem = new Memory();
      mem.writeByte(mkAddress(0x200), mkByte(0x42));
      assert.equal(mem.readByte(mkAddress(0x200)), 0x42);
    });

    it("初期化されていないアドレスは 0 を返す", () => {
      const mem = new Memory();
      assert.equal(mem.readByte(mkAddress(0x500)), 0x00);
    });
  });

  describe("readWord", () => {
    it("ビッグエンディアンで 2 バイトを結合する", () => {
      const mem = new Memory();
      mem.writeByte(mkAddress(0x200), mkByte(0xab));
      mem.writeByte(mkAddress(0x201), mkByte(0xcd));
      assert.equal(mem.readWord(mkAddress(0x200)), 0xabcd);
    });
  });

  describe("loadRom", () => {
    it("ROM を 0x200 から配置する", () => {
      const mem = new Memory();
      const rom = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      mem.loadRom(rom);
      assert.equal(mem.readByte(mkAddress(0x200)), 0x12);
      assert.equal(mem.readByte(mkAddress(0x201)), 0x34);
      assert.equal(mem.readByte(mkAddress(0x202)), 0x56);
      assert.equal(mem.readByte(mkAddress(0x203)), 0x78);
    });

    it("ROM がフォントデータを上書きしない", () => {
      const mem = new Memory();
      mem.loadRom(new Uint8Array([0xff]));
      assert.equal(mem.readByte(mkAddress(0x000)), FONT_DATA[0]);
    });

    it("大きすぎる ROM はエラー", () => {
      const mem = new Memory();
      const tooLarge = new Uint8Array(4096 - 0x200 + 1);
      assert.throws(() => mem.loadRom(tooLarge), Error);
    });
  });

  describe("reset", () => {
    it("RAM をクリアしてフォントを再配置する", () => {
      const mem = new Memory();
      mem.writeByte(mkAddress(0x300), mkByte(0xff));
      mem.reset();
      assert.equal(mem.readByte(mkAddress(0x300)), 0x00);
      assert.equal(mem.readByte(mkAddress(0x000)), FONT_DATA[0]);
    });
  });
});
