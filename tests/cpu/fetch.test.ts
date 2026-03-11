import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetch } from "../../src/cpu/fetch.ts";
import { createInitialCpuState } from "../../src/cpu/state.ts";
import { mkAddress, mkByte } from "../../src/domain/types.ts";
import { Memory } from "../../src/emulator/memory.ts";

describe("fetch", () => {
  it("PC のアドレスから 16bit ワードを読み出す", () => {
    const cpu = createInitialCpuState();
    const mem = new Memory();
    mem.writeByte(mkAddress(0x200), mkByte(0x12));
    mem.writeByte(mkAddress(0x201), mkByte(0x34));
    const word = fetch(cpu, mem);
    assert.equal(word, 0x1234);
  });

  it("fetch 後に PC が 2 増加する", () => {
    const cpu = createInitialCpuState();
    const mem = new Memory();
    mem.writeByte(mkAddress(0x200), mkByte(0x00));
    mem.writeByte(mkAddress(0x201), mkByte(0xe0));
    fetch(cpu, mem);
    assert.equal(cpu.pc, 0x202);
  });

  it("連続 fetch で順次読み出せる", () => {
    const cpu = createInitialCpuState();
    const mem = new Memory();
    mem.loadRom(new Uint8Array([0x00, 0xe0, 0x12, 0x34]));
    assert.equal(fetch(cpu, mem), 0x00e0);
    assert.equal(fetch(cpu, mem), 0x1234);
    assert.equal(cpu.pc, 0x204);
  });
});
